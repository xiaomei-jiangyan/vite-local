import { createApp } from "vue";
import router from "./router";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";

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
app.use(pinia);

app.use(router);

app.mount("#app");
