class Queue {
  constructor() {
    this.running = 0;
    this.limit = 5;
    this.queue = [];
    this.idleCbs = [];
  }
  add(cb) {
    return new Promise((resolve, reject) => {
      let cacheFn = () => {
        this.running += 1;
        return Promise.resolve(cb())
          .then((val) => {
            resolve(val);
            this.next();
          })
          .catch((err) => {
            reject(err);
            this.next();
          });
      };

      if (this.running >= this.limit) {
        this.queue.push(cacheFn);
      } else {
        cacheFn();
      }
    });
  }
  next() {
    this.running -= 1;
    let fn = this.queue.shift();
    if (fn) {
      fn();
    } else if (this.running === 0) {
      this.idleCbs.forEach((item) => item());
    }
  }
  waitTillIdle() {
    return new Promise((resolve, reject) => {
      if (this.running === 0) {
        resolve();
        return;
      }
      this.onIdle(() => {
        resolve();
      });
    });
  }
  onIdle(cb) {
    this.idleCbs.push(cb);
    return () => {
      const index = this.idleCbs.indexOf(cb);
      if (index !== -1) {
        this.idleCbs.splice(index, 1);
      }
    };
  }
  error(_) {
    console.log('Quicker: Queue -> error -> _', _);
  }
}

let queue = new Queue();

async function start() {
  await new Promise((resolve, reject) => {
    let files = Array(10).fill(0);
    files.forEach((v) => {
      queue.add(async () => {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(1);
          }, 2000);
        });
        console.log(v);
      });
    });
    resolve(queue.waitTillIdle());
  });
}
Promise.resolve(start()).then((d) => console.log(d, 'all done'));
// queue.waitTillIdle().then(() => console.log('all done'));
