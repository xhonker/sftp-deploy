export class Queue {
  add(test: () => Promise<void>) {
    let cacheFn = Promise.resolve(test())
  }
}