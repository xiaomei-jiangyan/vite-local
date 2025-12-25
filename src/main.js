import { createApp } from "vue";
import router from "./router";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import { i18n } from "@/i18n";
import VirtualScroller from "vue3-virtual-scroller";
import "vue3-virtual-scroller/dist/vue3-virtual-scroller.css";
import VConsole from "vconsole";
import toastPlugin from "@/plugins/toast";
import Antd from "ant-design-vue";
// import { registerSW } from "virtual:pwa-register";

// const vConsole = new VConsole();

(function flexible(designWidth = 375, maxWidth = 1024) {
  const docEl = document.documentElement;
  function setRem() {
    let width = docEl.clientWidth;
    if (width > maxWidth) width = maxWidth;
    docEl.style.fontSize = (width / designWidth) * 16 + "px"; // 1rem 基于 16px 默认
  }
  window.addEventListener("resize", setRem);
  window.addEventListener("orientationchange", setRem);
  setRem();
})(375);

const app = createApp(App);
const pinia = createPinia();

// const updateSW = registerSW({
//   onNeedRefresh() {
//     const userConfirmed = confirm("你确定要更新本应用么？");
//     if (userConfirmed) {
//       updateSW();
//     }
//   },
//   onOfflineReady() {
//     alert("太棒了，你的应用现在已经支持离线访问了！");
//   },
// });
// if (true) {
//   import("vconsole").then(({ default: VConsole }) => {
//     const { VConsoleDefaultPlugin } = VConsole;
//     new VConsoleDefaultPlugin();
//   });
// }

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // 新 SW 安装完成，提示用户刷新或直接跳过等待
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          }
        });
      });
    });
  });
  // SKIP_WAITING => actived => controllerchange事件触发
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // 可以弹窗提示用户
    window.location.reload();
    // showUpdatePopup.value = true;
  });
  navigator.serviceWorker.ready.then((reg) => {
    if ("sync" in reg) {
      reg.sync.register("post-queue-sync");
    }
  });
}

app.use(pinia);
app.use(i18n);
app.use(router);

app.use(Antd);

app.use(VirtualScroller);
// install toast plugin to expose $toast globally and via provide/inject
app.use(toastPlugin);
app.mount("#app");
