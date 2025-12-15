export class WorkerPool {
  constructor(workerScript, size = 2) {
    this.workers = [];
    this.queue = [];
    this.size = size;

    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerScript);
      worker.onmessage = (e) => {
        const callback = worker.callback;
        worker.callback = null;
        callback && callback(e.data);
        this._next();
      };
      this.workers.push(worker);
    }
  }

  _next() {
    if (this.queue.length === 0) return;
    const { messages, resolve } = this.queue.shift();
    const worker = this.workers.find((w) => !w.callback);
    if (worker) {
      worker.callback = resolve;
      worker.postMessage(messages);
    } else {
      // 所有 worker 忙，重新入队
      this.queue.unshift({ messages, resolve });
    }
  }

  run(messages) {
    return new Promise((resolve) => {
      this.queue.push({ messages, resolve });
      this._next();
    });
  }

  terminate() {
    this.workers.forEach((w) => w.terminate());
  }
}

/*
import { WorkerPool } from './workerPool.js';

const pool = new WorkerPool('./worker.js', 3); // 3个 worker 并行

const chatContainer = document.getElementById('chat');

function renderMessage(id, html) {
  const msgEl = document.getElementById(`msg-${id}`);
  if (msgEl) msgEl.innerHTML = html;
}

function addMessages(messages) {
  // 先在 DOM 创建占位元素
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.id = `msg-${msg.id}`;
    div.textContent = '解析中...';
    chatContainer.appendChild(div);
  });

  // 发到 WorkerPool 批量解析
  pool.run(messages).then(results => {
    results.forEach(r => renderMessage(r.id, r.html));
  });
}

// 测试
addMessages([
  { id: 1, text: 'Hello **World** :)' },
  { id: 2, text: 'I am sad :(' },
  { id: 3, text: 'This is **awesome** :)' },
  { id: 4, text: 'Batch **processing** rocks!' }
]);
*/
