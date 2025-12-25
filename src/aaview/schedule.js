class Scheduler {
  constructor(max) {
    this.max = max;
    this.quene = [];
    this.running = 0;
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      const task = async () => {
        this.running++;
        try {
          const result = await fn();
          resolve(result);
        } catch (e) {
          reject(e);
        } finally {
          this.running--;
          this.next();
        }
      };
      if (this.running < this.max) {
        Promise.resolve().then(task);
      } else {
        this.quene.push(task);
      }
    });
  }

  next() {
    while (this.max > this.running && this.quene.length > 0) {
      const task = this.quene.shift();
      task && Promise.resolve().then(task);
    }
  }
}
