import { sendSafeMessage } from "./client";
import { randomDelay, wait } from "~/.server/utils";

type QueueItem = {
  chatId: string;
  text: string;
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
    return new Promise((resolve, reject) => {
      this.queue.push({ chatId, text, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const { chatId, text, resolve, reject } = this.queue.shift()!;

      try {
        await sendSafeMessage(chatId, text);
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
