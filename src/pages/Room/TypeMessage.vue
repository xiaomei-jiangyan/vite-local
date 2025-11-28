<template>
  <div class="type-message" v-html="message"></div>
</template>
<script setup>
import { onMounted, onUpdated, ref } from "vue";

const props = defineProps({
  message: {
    type: String,
    required: true,
  },
});

const message = ref("");
const maxLength = props.message.length; // 设置最大长度
let currentLength = 0; // 当前显示的长度
let timer = null;

const everyInterval = () => {
  if (timer) clearTimeout(timer);
  const restLength = maxLength - currentLength;
  const interval = Math.floor(Math.random() * 50) + 50; // 随机间隔50到100毫秒
  if (restLength > 0) {
    const step = Math.floor(Math.random() * 3) + 1; // 每次增加1到3个字符
    const nextLength = Math.min(currentLength + step, maxLength); // 每次增加step个字符
    message.value = props.message.slice(0, nextLength);
    currentLength = nextLength;
  } else {
    if (timer) clearTimeout(timer);
    return;
  }
  timer = setTimeout(() => {
    everyInterval();
  }, interval);
};

onUpdated(() => {
  if (currentLength >= maxLength) {
    message.value = props.message; // 确保完全显示
    everyInterval();
  }
});

onMounted(() => {
  everyInterval();
});
</script>
<style scoped>
.type-message {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
