import { createVNode, render } from "vue";
import Toast from "./Toast.vue";

let instance = null;
let queue = [];
let showing = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useToast() {
  if (!instance) {
    // 创建 DOM 容器
    const el = document.createElement("div");
    document.body.appendChild(el);

    // 渲染 toast 组件
    const vnode = createVNode(Toast);
    render(vnode, el);

    instance = vnode.component.exposed;
  }

  function show(message, status = "info", duration = 2000) {
    queue.push({ message, status, duration });
    processQueue();
  }

  const success = (message, duration = 2000) => {
    show(message, "success", duration);
  };

  const error = (message, duration = 2000) => {
    show(message, "error", duration);
  };

  const warn = (message, duration = 2000) => {
    show(message, "warn", duration);
  };

  async function processQueue() {
    if (showing) return;
    const item = queue.shift();
    if (!item) return;
    showing = true;
    instance.show(item);
    await wait(item.duration);
    instance.hide();
    await wait(300);
    showing = false;
    processQueue();
  }

  return { show, success, error, warn };
}
