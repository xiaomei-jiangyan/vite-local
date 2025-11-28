<template>
  <div ref="wrapper" class="scroll-wrapper" @scroll="handleScroll">
    <div class="scroll-inner" :style="{ height: totalHeight + 'px' }">
      <MessageCard
        v-for="msg in visibleMessages"
        :key="msg.msgId"
        :msg="msg"
        :style="{
          position: 'absolute',
          top: msg.top + 'px',
          width: '100%',
        }"
        :setRealHeight="setRealHeight"
      />
    </div>
  </div>
</template>

<script setup>
// 第一次尝试虚拟列表，滚动到底部出现问题，已暂停
import { ref, computed, watch, nextTick, onMounted } from "vue";
import MessageCard from "../components/MessageCard.vue";

// -----------------------------
// 1. 基础数据
// -----------------------------
const props = defineProps({
  messages: Array, // 所有消息
});

// 存储每条消息高度
const heightMap = new Map();

// prefix heights 前缀和
let prefixHeights = [];

// 可视窗口信息
const wrapper = ref();
const viewHeight = ref(0);

// 可视区域渲染的消息
const visibleMessages = ref([]);

// 当前 scrollTop
const scrollTop = ref(0);

// 预留渲染缓存区
const BUFFER = 500;

// -----------------------------
// 2. 计算前缀和
// -----------------------------
const buildPrefix = () => {
  prefixHeights = new Array(props.messages.length).fill(0);

  let running = 0;
  for (let i = 0; i < props.messages.length; i++) {
    prefixHeights[i] = running;
    running += heightMap.get(props.messages[i].msgId) || 80; // 给个默认高度
  }
};

// 总高度
const totalHeight = computed(() => {
  if (props.messages.length === 0) return 0;
  const last = props.messages[props.messages.length - 1];
  return prefixHeights[prefixHeights.length - 1] + (heightMap.get(last.msgId) || 80);
});

// -----------------------------
// 3. 根据 scrollTop 找到 startIndex
// -----------------------------
const getStartIndex = () => {
  let low = 0,
    high = props.messages.length - 1;
  let res = 0;

  while (low <= high) {
    const mid = ((low + high) / 2) | 0;
    if (prefixHeights[mid] < scrollTop.value) {
      res = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return res;
};

// -----------------------------
// 4. 计算哪些消息应该渲染
// -----------------------------
const updateVisible = () => {
  if (!wrapper.value) return;

  const start = getStartIndex();

  let end = start;
  const max = scrollTop.value + viewHeight.value + BUFFER;

  while (end < props.messages.length && prefixHeights[end] < max) {
    end++;
  }

  const slice = props.messages.slice(start, end);

  visibleMessages.value = slice.map((msg, i) => {
    const realIndex = start + i;
    return {
      ...msg,
      top: prefixHeights[realIndex],
    };
  });
};

// -----------------------------
// 5. 处理滚动
// -----------------------------
const handleScroll = () => {
  scrollTop.value = wrapper.value.scrollTop;
  updateVisible();
};

// -----------------------------
// 6. 记录 MessageCard 的真实高度 + 更新 prefix
// -----------------------------

const setRealHeight = (msgId, h) => {
  if (h && heightMap.get(msgId) !== h) {
    heightMap.set(msgId, h);
    buildPrefix();
    updateVisible();
  }
};

// -----------------------------
// 7. 监听消息列表变化（加载历史 / 添加新消息）
// -----------------------------
watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    buildPrefix();
    updateVisible();
  },
  { immediate: true }
);

// -----------------------------
// 8. 初始化
// -----------------------------
onMounted(() => {
  viewHeight.value = wrapper.value.clientHeight;
  buildPrefix();
  updateVisible();
});
</script>

<style scoped>
.scroll-wrapper {
  position: relative;
  overflow-y: auto;
  height: 100%;
}

.scroll-inner {
  position: relative;
  width: 100%;
}
</style>
