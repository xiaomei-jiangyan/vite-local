// 实现图片加载最大并发数，超过可视区则取消加载，在可视区内才加载
// 我最早的实现是直接在 load 中做并发控制和 abort，
// 但后来发现 cache 生命周期、Promise 复用和 abort 行为耦合过深，于是重构成独立调度器模型，统一管理并发、队列和资源回收。

// 图片资源并发调度与可视区加载优化
// 针对图片密集型页面，设计并实现图片加载调度器，解决并发失控、首屏阻塞与快速滚动产生的无效请求问题。
// 设计 图片加载并发调度器，限制最大并发数，避免图片请求挤占关键资源
// 引入 高优先级队列，确保首屏 / 可视区图片优先加载，提升首屏渲染速度
// 基于 Promise 级缓存，避免同一图片在并发场景下重复请求
// 结合 IntersectionObserver + AbortController，在图片离开可视区时主动中断加载，减少无效网络与解码开销
// 统一管理 并发计数、队列调度与资源回收，解耦加载逻辑与调度逻辑，提升系统可维护性

// 在并发场景下，多个调用方可能同时请求同一图片，缓存 Promise 可以确保只发起一次真实请求，同时让多个调用方共享同一加载状态，避免重复请求和竞态问题。
// Image 本身无法像 fetch 一样真正中断网络请求，这里的 abort 主要是中断后续解码与回调，避免无意义的资源占用，尤其在快速滚动和弱网场景下能显著减少主线程和内存压力。
// 原生 lazy-loading 无法控制并发数和加载优先级，在图片密集且快速滚动的场景下容易造成首屏资源被阻塞，因此需要在业务层引入调度能力。

// running 会不会变成负数？
// 追问点：
// abort + finally 是否可能多次触发
// 多个 finally 同时执行
// 答法要点：
// running 的修改统一放在 finally 中，保证每个任务只在生命周期结束时减一次；abort 只负责中断，不参与调度，避免重复修改并发计数。

// 追问点：
// cache 命中
// 并发去重
// 答法要点：
// 使用 Promise 级缓存，同一 src 在加载中只会发起一次请求，其它调用方共享同一个 Promise，避免重复请求。

// abort 后再次进入可视区怎么办？
// 追问点：
// cache 是否残留
// 是否能重新加载
// 答法要点：
// abort 后在 finally 中清理 cache，下次进入可视区会重新进入调度流程，不会命中脏缓存。

// 在快速滚动场景下，如果图片继续加载，即使用户已经看不到，也会占用网络带宽、主线程和内存，尤其在弱网或大页面中可能导致卡顿或内存激增。
// 所以我选择在离开可视区时取消加载（abort），同时保证再次进入可视区时可以重新调度。
// 这样既节约了资源，又保证了用户可见区域的图片优先加载。
// 如果业务要求，我也可以结合低清图或占位图策略，实现弱网降级加载。

// highQueue 优先出队，但不抢占已加载任务；低优先级只是等待，不会完全饿死。
// highQuene 的任务始终在出队时优先，但正在执行的任务不会被打断，所以低优先级任务不会完全饿死，只是等待时间可能稍长。
// 对于绝大多数业务场景，这种“优先而非抢占”的策略可以保证首屏资源优先显示，
// 同时不阻塞低优先级资源的加载。如果业务要求严格，也可以加入 队列权重调度或时间片，避免低优先级任务等待过久。

// “我在一个图片密集型搜索页面中实现了 ImageLoader 图片调度器，解决了快速滚动下大量无效请求的问题。
// 核心思路是限制并发、优先加载首屏、离开可视区取消加载，同时缓存 Promise 避免重复请求，并处理好 abort 与调度的边界。
// 通过这套方案，我既提升了首屏渲染速度，也降低了网络和内存压力，同时可扩展弱网降级和占位图策略。”

class ImageScheduler {
  constructor(config = {}) {
    this.quene = [];
    this.highQuene = [];
    this.max = config.max || 2;
    this.running = 0;
    this.cache = new Map();
  }

  imageToBlob(img) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob));
    });
  }

  load(src, high) {
    const task = (src, controller) => {
      if (this.cache.has(src)) {
        return this.cache.get(src).promise;
      }
      this.running++;
      const p = new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = src;
        if (controller.signal) {
          // Image 无法像 fetch 一样真正取消请求，这里主要是避免后续解码与回调，减少主线程与内存压力
          controller.signal.addEventListener("abort", function () {
            image.src = "";
            reject("abort");
          });
        }
        image.onload = async (res) => {
          const blob = await this.imageToBlob(image);
          const blobUrl = URL.createObjectURL(blob);
          resolve({
            ...image,
            blobUrl,
          });
        };
        image.onerror = reject;
      }).finally(() => {
        this.running--;
        // this.cache.delete(src);
        this.next();
      });
      this.cache.set(src, { promise: p, controller });
      return p;
    };
    const controller = new AbortController();
    if (this.running >= this.max) {
      return new Promise((res, rej) => {
        const runner = () => task(src, controller).then(res, rej);
        high ? this.highQuene.push(runner) : this.quene.push(runner);
      });
    } else {
      return task(src, controller);
    }
  }

  abort(src) {
    const cache = this.cache.get(src);
    if (cache) {
      cache.controller.abort();
    }
  }

  next() {
    if (this.running >= this.max) return;
    let current;
    if (this.highQuene.length) {
      current = this.highQuene.shift();
    } else {
      current = this.quene.shift();
    }
    current && current();
  }
}

const scheduler = new ImageScheduler();

export default scheduler;
