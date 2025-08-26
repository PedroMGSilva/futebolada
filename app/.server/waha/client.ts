import { config } from "~/.server/config";
import { randomDelay, wait } from "~/.server/utils";

interface WahaClientOptions {
  baseUrl: string;         // e.g. "http://localhost:3000/api"
  apiKey: string;          // your X-Api-Key
  session?: string;        // defaults to "default"
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
    body: Record<string, unknown>
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
        "accept": "application/json",
      },
      body: JSON.stringify({ ...body, session: this.session }),
    });

    console.log("body", JSON.stringify({ ...body, session: this.session }));

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
  async sendMessage(chatId: string, text: string): Promise<{ id: string }> {
    return this.request<{ id: string }>("/sendText", { chatId, text });
  }
}

const client = new WahaClient({
  baseUrl: config.waha.baseUrl,
  apiKey: config.waha.apiKey,
  session: "default",
});

export async function sendSafeMessage(
  chatId: string,
  text: string
): Promise<void> {
  // Step 1: Mark as seen
  await client.sendSeen(chatId);

  // Step 2: Start typing
  await client.startTyping(chatId);

  // Step 3: Wait a realistic typing delay (e.g. 1–3s)
  await wait(randomDelay(1000, 3000));

  // Step 4: Stop typing
  await client.stopTyping(chatId);

  // Step 5: Send the message
  const message = await client.sendMessage(chatId, text);
  console.log("✅ Message sent:", message.id);
}