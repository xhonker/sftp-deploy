type promiseFn = () => void | Promise<void>;

interface IQueue {
  add(fn: promiseFn): void
  waitTillIdle(): Promise<void>
}

interface IQueueOptions {
  concurrency: number;
}
export class Queue implements IQueue {
  public running: number = 0;
  public queue: promiseFn[] = [];
  public concurrency: number;
  public done: Function | undefined;
  constructor({ concurrency }: IQueueOptions = { concurrency: 1 }) {
    this.concurrency = concurrency
  }
  public add(fn: promiseFn) {
    return new Promise((resolve, reject) => {
      let cacheFn = async () => {
        this.running += 1;
        await Promise.resolve(fn()).catch(reject)
        this.next();
      }

      if (this.running >= this.concurrency) {
        this.queue.push(cacheFn)
      } else {
        cacheFn();
      }
    })
  }
  private next() {
    this.running -= 1;
    let nextFn = this.queue.shift();
    if (nextFn) {
      nextFn()
    } else if (this.running === 0) {
      this.done && this.done();
    }
  }
  public waitTillIdle(): Promise<void> {
    return new Promise((resolve) => {
      if (this.running === 0) return resolve();
      this.done = resolve
    })
  }
}