class ImageLoader {
  // 实现首屏图片先加载，并发不超过4个，存储blob url, 降级超时策略

  constructor(options = {}) {
    this.options = options;
    this.max = options.max || 5;
    this.priority = options.priority || "normal";
    this.timeout = options.timeout || 2000;
    this.fetchStrategy = options.fetchStrategy || "passthrough";

    this.blobMap = new Map();
    this.start = 0;
    this.highQuene = [];
    this.quene = [];
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const task = { src, resolve, reject };

      const running = () => {
        this.start++;
        this._loadImage(task);
      };

      if (this.start >= this.max) {
        this._push(task);
      } else {
        running();
      }
    });
  }

  _push(task) {
    if (this.priority === "high") {
      this.highQuene.unshift(task);
    } else {
      this.quene.push(task);
    }
  }

  _resolve(r, src) {
    r(src);
    this.start--;
    if (this.start < this.max) {
      this._next();
    }
  }

  _next() {
    const current = this.highQuene.length > 0 ? this.highQuene.shift() : this.quene.shift();
    if (!current) return;
    this._loadImage(current);
  }

  async _loadImage(task) {
    if (!task) return;
    const { resolve, reject, src } = task;
    const _blobUrl = this.blobMap.get(src);
    if (!_blobUrl) {
      const start = performance.now();
      const resp = await fetch(src);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const end = performance.now();
      if (end - start > this.timeout) {
        if (this.fetchStrategy === "reject") {
          this._resolve(reject, new Error("超时"));
        } else {
          this._resolve(resolve, src);
        }
      } else {
        this.blobMap.set(src, blobUrl);
        this._resolve(resolve, blobUrl);
      }
    } else {
      this._resolve(resolve, _blobUrl);
    }
  }

  release() {
    const blobs = [...this.blobMap.values()];
    blobs.forEach((blob) => URL.revokeObjectURL(blob));
    this.blobMap.clear();
  }
}
