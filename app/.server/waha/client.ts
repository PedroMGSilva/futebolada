import { config } from "~/.server/config";
import { randomDelay, wait } from "~/.server/utils";

type SendResult = { key?: { id?: string } };

interface WahaClientOptions {
  baseUrl: string; // e.g. "http://localhost:3000/api"
  apiKey: string; // your X-Api-Key
  session?: string; // defaults to "default"
}

class WahaClient {
  private baseUrl: string;
  private apiKey: string;
  private session: string;

  constructor(options: WahaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ""); // remove trailing slash
    this.apiKey = options.apiKey;
    this.session = options.session ?? "default";
  }

  private async request<T>(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
        accept: "application/json",
      },
      body: JSON.stringify({ ...body, session: this.session }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`WAHA request failed: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Send a "seen" marker to a chat
   */
  async sendSeen(chatId: string): Promise<void> {
    await this.request("/sendSeen", { chatId });
  }

  /**
   * Start typing in a chat
   */
  async startTyping(chatId: string): Promise<void> {
    await this.request("/startTyping", { chatId });
  }

  /**
   * Stop typing in a chat
   */
  async stopTyping(chatId: string): Promise<void> {
    await this.request("/stopTyping", { chatId });
  }

  /**
   * Send a text message
   */
  async sendMessage(chatId: string, text: string): Promise<SendResult> {
    return this.request<SendResult>("/sendText", { chatId, text });
  }

  /**
   * Send a JPEG image, optionally with a caption
   */
  async sendImage(
    chatId: string,
    jpeg: Buffer,
    caption: string,
  ): Promise<SendResult> {
    return this.request<SendResult>("/sendImage", {
      chatId,
      caption,
      file: {
        mimetype: "image/jpeg",
        filename: "equipas.jpg",
        data: jpeg.toString("base64"),
      },
    });
  }
}

const client = new WahaClient({
  baseUrl: config.waha.baseUrl,
  apiKey: config.waha.apiKey,
  session: "default",
});

export type OutgoingMessage =
  | { kind: "text"; chatId: string; text: string }
  | { kind: "image"; chatId: string; jpeg: Buffer; caption: string };

export async function sendSafeMessage(message: OutgoingMessage): Promise<void> {
  const { chatId } = message;

  // Step 1: Mark as seen
  await client.sendSeen(chatId);

  // Step 2: Start typing
  await client.startTyping(chatId);

  // Step 3: Wait a realistic typing delay (e.g. 1–3s)
  await wait(randomDelay(1000, 3000));

  // Step 4: Stop typing
  await client.stopTyping(chatId);

  // Step 5: Send the message
  const sent =
    message.kind === "text"
      ? await client.sendMessage(chatId, message.text)
      : await client.sendImage(chatId, message.jpeg, message.caption);

  console.log(`✅ ${message.kind} sent:`, sent.key?.id ?? "(no id returned)");
}
