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

const vConsole = new VConsole();

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

// if (true) {
//   import("vconsole").then(({ default: VConsole }) => {
//     const { VConsoleDefaultPlugin } = VConsole;
//     new VConsoleDefaultPlugin();
//   });
// }

app.use(pinia);
app.use(i18n);
app.use(router);

app.use(Antd);

app.use(VirtualScroller);
// install toast plugin to expose $toast globally and via provide/inject
app.use(toastPlugin);
app.mount("#app");
