<template>
  <!-- <VirtualGroup :messages="roomStore.groupMessage" /> -->
  <div class="scrollbar" ref="wrapper">
    <div class="loadMore" ref="loadMore">{{ hasMore ? "加载更多..." : "没有更多了" }}</div>
    <DynamicScroller
      :items="roomStore.groupMessage"
      :min-item-size="25"
      key-field="msgId"
      :emit-update="true"
      class="scroller"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.message]"
          :data-index="index"
          :data-active="active"
          :title="`Click to change message ${index}`"
          class="message"
        >
          <MessageCard :msg="item" />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script setup>
// 第一次尝试虚拟列表，滚动到底部出现问题，已暂停
import { onMounted, ref, nextTick, computed } from "vue";
import MessageCard from "../components/MessageCard.vue";
import VirtualGroup from "./VirtualGroup.vue";
import { throttle } from "@/utils/index";
import { useWebSocket } from "@/hooks/useWebsocket";
import { useRoomStore } from "@/store/room";

defineOptions({ name: "Group" });

const wrapper = ref(null);
const roomStore = useRoomStore();
const hasMore = ref(true);
let pageNum = 0;

const throttledScroll = throttle(onScroll, 50);

async function onScroll() {
  const el = wrapper.value;
  if (!el) return;

  // 顶部加载历史消息
  if (el.scrollTop <= 300 && !loading.value && hasMore.value) {
    loading.value = true;
    loadHistory();
  }
}

async function loadHistory() {
  handleSendMessage();
}

onMounted(() => {
  const el = wrapper.value;
  // containerHeight.value = el.clientHeight;

  el.addEventListener("scroll", throttledScroll);
});
// const wrapper = ref(null);
// const loadMore = ref(null);
// const threshold = 200;

const loading = ref(false);
// let prevScrollHeight = 0;
// let prevScrollTop = 0;

// const scrollTop = ref(0);
// const estiHeight = 80;
// const containerHeight = ref(0);
// const total = computed(() => roomStore.groupMessage.length);

// const isFirstScrollToBottom = ref(true);

// const visibleCount = computed(() => Math.ceil(containerHeight.value / estiHeight));
// const startIndex = computed(() => {
//   return Math.max(0, Math.floor(scrollTop.value / estiHeight) - 5);
// });
// const endIndex = computed(() => {
//   return Math.min(total.value, startIndex.value + visibleCount.value + 5);
// });

// const vituralLists = computed(() => {
//   return roomStore.groupMessage.slice(startIndex.value, endIndex.value);
// });

// attach scroll listener to trigger top-load
onMounted(() => {});

// websocket handling
const { isOpen, sendMessage, close } = useWebSocket("ws://localhost:8080?room=2", {
  autoReconnect: true,
  reconnectInterval: 3000,
  onOpen() {
    handleSendMessage();
  },
  onMessage: async (event) => {
    const msgs = JSON.parse(event.data);
    if (Array.isArray(msgs)) {
      roomStore.batchSave(msgs.map((msg) => ({ ...msg, isSelf: false })));
      if (msgs.length < 10) hasMore.value = false;
    } else {
      roomStore.saveGroupMsg({ ...msgs, isSelf: false });
    }
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
</script>

<style scoped>
.vue-recycle-scroller {
  height: 100%;
}
.box {
  height: 200px;
  overflow: auto;
  background: #eee;
}

.abs {
  position: absolute;
  top: 0;
  height: 1000px;
  background: orange;
}

.scrollbar {
  width: 100%;
  height: 100%;
  -webkit-overflow-scrolling: touch;
  overflow: hidden;
  overflow-y: auto;
}

.lists-wrapper {
  position: relative;
  margin: 0.5rem;
  box-sizing: border-box;
}

.isSelf {
  text-align: right;
}

.loadMore {
  text-align: center;
  padding: 0.25rem 0;
}

/* Enter */
.msg-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.msg-enter-active {
  transition:
    opacity 0.1s ease,
    transform 0.2s ease;
}
.msg-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Leave */
.msg-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.msg-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.2s ease;
}
.msg-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.msg-list {
  position: relative;
}

.isSelf {
  text-align: right;
}

.loadMore {
  text-align: center;
  padding: 0.25rem 0;
}

/* Enter */
.msg-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.msg-enter-active {
  transition:
    opacity 0.1s ease,
    transform 0.2s ease;
}
.msg-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Leave */
.msg-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.msg-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.2s ease;
}
.msg-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.msg-list {
  position: relative;
}
</style>
