import { sendSafeMessage, type OutgoingMessage } from "./client";
import { randomDelay, wait } from "~/.server/utils";

type QueueItem = {
  message: OutgoingMessage;
  resolve: () => void;
  reject: (err: unknown) => void;
};

class RateLimitedSender {
  private queue: QueueItem[] = [];
  private processing = false;
  private minInterval: number; // ms between sends

  constructor(messagesPerMinute = 20) {
    this.minInterval = Math.floor(60000 / messagesPerMinute);
  }

  async send(chatId: string, text: string): Promise<void> {
    return this.enqueue({ kind: "text", chatId, text });
  }

  async sendImage(
    chatId: string,
    jpeg: Buffer,
    caption: string,
  ): Promise<void> {
    return this.enqueue({ kind: "image", chatId, jpeg, caption });
  }

  private async enqueue(message: OutgoingMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ message, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const { message, resolve, reject } = this.queue.shift()!;

      try {
        await sendSafeMessage(message);
        resolve();
      } catch (err) {
        reject(err);
      }

      // wait before next send
      await wait(this.minInterval + randomDelay(500, 1500));
    }

    this.processing = false;
  }
}

const sender = new RateLimitedSender(15);

export default sender;
