class ImageLoader {
  constructor(options = {}) {
    this.max = options.maxConcurrency || 4;
    this.running = 0;
    this.queue = [];

    // 缓存
    this.blobCache = new Map();
    this.urlCache = new Map();
    this.refCount = new Map();

    // CDN 白名单策略
    this.cdnWhitelist = options.cdnWhitelist || [];

    // 非白名单处理：reject | passthrough
    this.nonCdnPolicy = options.nonCdnPolicy || "passthrough";

    // 弱网策略参数
    this.network = navigator.connection?.effectiveType || "4g";
    this.slowThreshold = options.slowThreshold || 800; // 下载超过 800ms判定弱网

    // 首屏优先任务
    this.highPriorityQueue = [];
  }

  /** 判断是否是白名单 CDN */
  _isFromCDN(src) {
    try {
      const host = new URL(src).host;
      return this.cdnWhitelist.some((cdn) => host.includes(cdn));
    } catch (e) {
      return false;
    }
  }

  /**
   * 外部调用
   * options:
   *   priority: 'high' | 'normal'
   *   thumbnail: 预备的小图 URL (弱网降级时使用)
   */
  load(src, options = {}) {
    return new Promise((resolve, reject) => {
      const task = { src, resolve, reject, options };

      if (options.priority === "high") {
        this.highPriorityQueue.unshift(task); // 首屏任务靠前
      } else {
        this.queue.push(task);
      }

      this._run();
    });
  }

  /** 队列调度逻辑（高优先级 > 普通） */
  async _run() {
    if (this.running >= this.max) return;

    const task = this.highPriorityQueue.length
      ? this.highPriorityQueue.shift()
      : this.queue.shift();

    if (!task) return;

    this.running++;

    try {
      const url = await this._loadImage(task.src, task.options);
      task.resolve(url);
    } catch (e) {
      task.reject(e);
    } finally {
      this.running--;
      this._run();
    }
  }

  /** 实际图片加载逻辑 */
  async _loadImage(src, options) {
    const { thumbnail } = options || {};

    // ⛔ 1. CDN 白名单验证
    if (!this._isFromCDN(src)) {
      if (this.nonCdnPolicy === "reject") {
        throw new Error(`[ImageLoader] Non-CDN blocked: ${src}`);
      }

      // passthrough 直接使用原图 URL
      return src;
    }

    // ✔ CDN 篇：走 blob 流程
    // 缓存优先
    if (this.urlCache.has(src)) {
      this.refCount.set(src, this.refCount.get(src) + 1);
      return this.urlCache.get(src);
    }

    const start = performance.now();
    const resp = await fetch(src);
    const blob = await resp.blob();
    const end = performance.now();

    // ⏱ 判断弱网
    const cost = end - start;
    const isSlow = cost > this.slowThreshold || this._isWeakNetwork();

    if (isSlow && thumbnail) {
      // 弱网降级到 thumbnail
      return thumbnail;
    }

    // 生成 Blob URL + 缓存
    this.blobCache.set(src, blob);
    const objectURL = URL.createObjectURL(blob);
    this.urlCache.set(src, objectURL);
    this.refCount.set(src, 1);

    return objectURL;
  }

  /** 判断弱网 */
  _isWeakNetwork() {
    return ["2g", "slow-2g"].includes(this.network);
  }

  /** 引用计数 -1 */
  release(src) {
    if (!this.refCount.has(src)) return;

    const count = this.refCount.get(src) - 1;

    if (count <= 0) {
      URL.revokeObjectURL(this.urlCache.get(src));
      this.urlCache.delete(src);
      this.blobCache.delete(src);
      this.refCount.delete(src);
    } else {
      this.refCount.set(src, count);
    }
  }
}

export const imageLoader = new ImageLoader({
  maxConcurrency: 4,
  cdnWhitelist: ["cdn.xxx.com", "img.example.com"],
  nonCdnPolicy: "passthrough", // 或 'reject'
  slowThreshold: 700,
});
