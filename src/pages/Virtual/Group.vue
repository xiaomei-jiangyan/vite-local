<template>
  <div class="scrollbar" ref="wrapper">
    <!-- 顶部加载更多按钮 -->
    <div class="loadMore" ref="loadMore">{{ hasMore ? "加载更多..." : "没有更多了" }}</div>

    <div class="lists-wrapper">
      <!-- 顶部占位 -->
      <div :style="{ height: topPadding + 'px' }"></div>

      <!-- 真正渲染的可视区消息 -->
      <div class="item-container">
        <template v-for="msg in visibleList" :key="msg.msgId">
          <MessageCard :msg="msg" @updateHeight="onMsgHeight" />
        </template>
      </div>

      <!-- 底部占位 -->
      <div :style="{ height: bottomPadding + 'px' }"></div>
    </div>
  </div>
</template>

<script setup>
// 正确实现不定高虚拟列表效果
import { ref, computed, onMounted, nextTick } from "vue";
import MessageCard from "./MessageCard.vue";
import { useRoomStore } from "./store";
import { throttle } from "@/utils/index";
import { useWebSocket } from "@/hooks/useWebsocket";

const wrapper = ref(null);
const hasMore = ref(true);
let pageNum = 0;

const store = useRoomStore();
// =======================
// 1. 虚拟滚动参数
// =======================
const estiHeight = 80; // 预估高度
const scrollTop = ref(0);
const containerHeight = ref(0);

// 所有消息总数
const total = computed(() => store.messages.value.length);

// 可视数量
const buffer = 5;

// const visibleCount = computed(() => Math.ceil(containerHeight.value / estiHeight) + buffer * 2);

const startIndex = computed(() => {
  const start = Math.max(0, findRealStartIndex(scrollTop.value) - buffer);
  return start;
});
const endIndex = computed(() => {
  const end = Math.min(
    total.value,
    findRealStartIndex(scrollTop.value + containerHeight.value) + buffer
  );
  return end;
});
// 计算可视数据
const visibleList = computed(() => {
  return store.messages.value.slice(startIndex.value, endIndex.value);
});

function findRealStartIndex(scrollTop) {
  const arr = store.prefixHeights.value;
  let low = 0,
    right = arr.length - 1;
  while (low < right) {
    const mid = (low + right) >> 1;
    if (arr[mid] <= scrollTop) {
      low = mid + 1;
    } else {
      right = mid;
    }
  }
  return Math.max(0, low - 1);
}

// =======================
// 2. 顶/底 padding 计算
// =======================
const topPadding = ref(0);
const bottomPadding = ref(0);

function updatePadding() {
  let prefix = store.prefixHeights.value;
  topPadding.value = prefix[startIndex.value];
  bottomPadding.value = prefix[prefix.length - 1] - prefix[endIndex.value] || 0;
}

// =======================
// 3. 每条消息高度更新
// =======================
function onMsgHeight(id, height) {
  store.setMsgHeight(id, height);
  updatePadding();
}

// =======================
// 4. 滚动事件（含预加载）
// =======================
let prevScrollHeight = 0;
let loading = ref(false);

async function onScroll() {
  const el = wrapper.value;
  if (!el) return;

  // 顶部加载历史消息
  if (el.scrollTop <= 300 && !loading.value && el.scrollTop < scrollTop.value && hasMore.value) {
    loading.value = true;
    prevScrollHeight = el.scrollHeight;
    loadHistory();
  }
  scrollTop.value = el.scrollTop;
  await nextTick();
  updatePadding();
}

const throttledScroll = throttle(onScroll, 50);
// ws 通信
const { isOpen, sendMessage, close } = useWebSocket("ws://localhost:8080?room=2", {
  autoReconnect: true,
  reconnectInterval: 3000,
  onOpen() {
    handleSendMessage();
  },
  onMessage: async (event) => {
    let newMsgs = JSON.parse(event.data);
    if (!Array.isArray(newMsgs)) {
      newMsgs = [{ ...newMsgs }];
    }
    store.insertMsgs(newMsgs);
    if (newMsgs.length === 0) hasMore.value = false;

    await nextTick();
    updatePadding();

    // 修正加载前后 scrollHeight 差值
    setTimeout(() => {
      const el = wrapper.value;
      if (el) {
        const diff = el.scrollHeight - prevScrollHeight;
        wrapper.value.scrollTop = diff;
        scrollTop.value = diff;
        console.log("diff", diff);
      }
    }, 0);

    loading.value = false;
  },
});

function handleSendMessage() {
  if (isOpen.value) {
    if (!hasMore.value) return;
    const msg = {
      pageSize: 30,
      pageNum: ++pageNum,
      type: "query",
    };
    sendMessage(JSON.stringify(msg));
  } else {
    console.log("WebSocket is not open.");
  }
}

// =======================
// 5. 模拟请求历史消息
// =======================
async function loadHistory() {
  handleSendMessage();
}

// =======================
// 6. 初始化
// =======================
onMounted(() => {
  const el = wrapper.value;
  containerHeight.value = el.clientHeight;

  el.addEventListener("scroll", throttledScroll);

  // 初始滚动到底部
  // nextTick(() => {
  //   el.scrollTop = el.scrollHeight;
  // });
  // nextTick(() => {
  //   const el = wrapper.value;
  //   if (el) {
  //     // 再次在下一帧滚动到底部
  //     Promise.resolve().then(() => {
  //       requestAnimationFrame(() => {
  //         el.scrollTop = el.scrollHeight;
  //       });
  //     });
  //   }
  // });
  setTimeout(() => {
    el.scrollTop = el.scrollHeight;
  }, 250);
});
</script>

<style scoped>
.scrollbar {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.lists-wrapper {
  position: relative;
}

.item-container {
  position: relative;
}

.loadMore {
  text-align: center;
  padding: 0.5rem 0;
  color: #888;
}
</style>
