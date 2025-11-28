<template>
  <svg class="icon" aria-hidden="true">
    <use :href="`#icon-${name}`"></use>
  </svg>
</template>

<script setup>
import { onMounted } from "vue";

const props = defineProps({
  name: String,
  scripts: {
    type: Array,
    default: () => [
      "//at.alicdn.com/t/c/font_5073570_lzc2z1rkzh.js", // 你的 iconfont symbol 地址
    ],
  },
});
onMounted(() => {
  loadScript();
});

function loadScript() {
  const loaded = new Set();
  return (function () {
    props.scripts.forEach((src) => {
      if (loaded.has(src)) return;
      loaded.add(src);
      const script = document.createElement("script");
      script.src = src;
      document.body.appendChild(script);
    });
  })();
}
</script>

<style scoped>
.icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  color: currentColor;
}
</style>
