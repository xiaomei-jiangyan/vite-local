<template>
  <!-- <div class="scrollbar" ref="wrapper" :data-len="vituralLists.length">
    <div class="loadMore" ref="loadMore">{{ hasMore ? "Load More..." : "No More Data" }}</div>
    <div class="lists-wrapper">
      <template v-for="msg in vituralLists" :key="msg.msgId">
        <MessageCard
          :msg="msg"
          :style="{ top: msg.top + 'px', position: 'absolute', width: '100%' }"
        />
      </template>
    </div>
  </div> -->
  <VirtualGroup :messages="roomStore.groupMessage" />
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

const roomStore = useRoomStore();
const hasMore = ref(true);
let pageNum = 0;

const wrapper = ref(null);
const loadMore = ref(null);
const threshold = 200;

const loading = ref(false);
let prevScrollHeight = 0;
let prevScrollTop = 0;

const scrollTop = ref(0);
const estiHeight = 80;
const containerHeight = ref(0);
const total = computed(() => roomStore.groupMessage.length);

const isFirstScrollToBottom = ref(true);

const visibleCount = computed(() => Math.ceil(containerHeight.value / estiHeight));
const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / estiHeight) - 5);
});
const endIndex = computed(() => {
  return Math.min(total.value, startIndex.value + visibleCount.value + 5);
});

const vituralLists = computed(() => {
  return roomStore.groupMessage.slice(startIndex.value, endIndex.value);
});

// attach scroll listener to trigger top-load
onMounted(() => {
  wrapper.value?.addEventListener("scroll", () => {
    const _scrollTop = wrapper.value ? wrapper.value.scrollTop : 0;
    if (_scrollTop <= threshold && hasMore.value && !loading.value) {
      prevScrollHeight = wrapper.value ? wrapper.value.scrollHeight : 0;
      prevScrollTop = wrapper.value ? wrapper.value.scrollTop : 0;
      loading.value = true;
      // handleSendMessage();
    }
    // if (isFirstScrollToBottom.value) {
    scrollTop.value = _scrollTop;
    // isFirstScrollToBottom.value = false;
    // }

    setTimeout(() => {
      // 更新项目更新后的高度累计列表
      updateHeigthPrefix();
    }, 200);
  });
  nextTick(() => {
    containerHeight.value = wrapper.value ? wrapper.value.clientHeight : 0;
  });
  setTimeout(() => {
    if (wrapper.value) {
      // const scrollTop
      const total = totalHeightSum.value;
      const lastIndex = total.length - 1;
      // total[lastIndex] is the top offset of last item; need its height to compute full content height
      const lastMsg = roomStore.groupMessage[lastIndex];
      const lastHeight = lastMsg
        ? roomStore.msgHeight.get(lastMsg.msgId) ?? estiHeight
        : estiHeight;
      const fullHeight = (total[lastIndex] ?? 0) + lastHeight;
      // scroll so the bottom of content aligns with bottom of container
      const target = Math.max(
        0,
        fullHeight - (wrapper.value.clientHeight || containerHeight.value)
      );
      console.log(111, "initial scroll target", target, "fullHeight", fullHeight);
      wrapper.value.scrollTop = target;

      scrollTop.value = target;
    }
  }, 300);
});

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
      // prepend older messages
      roomStore.batchSave(msgs.map((msg) => ({ ...msg, isSelf: false })));
      if (msgs.length < 10) hasMore.value = false;
      // restore scroll position by scrollHeight delta
      nextTick(() => {
        if (loading.value && wrapper.value) {
          const delta = wrapper.value.scrollHeight - prevScrollHeight;
          // wrapper.value.scrollTop = wrapper.value.scrollTop + delta;
          loading.value = false;
        }
      });
    } else {
      // append new single message
      roomStore.saveGroupMsg({ ...msgs, isSelf: false });
    }
    await nextTick();
    setTimeout(() => {
      // 更新每一项的高度和估算累计高度值
      updateHeigthPrefix();
    }, 50);
  },
});

const totalHeightSum = ref([]);
function updateHeigthPrefix() {
  let total = [];
  let height = 0;
  const length = roomStore.groupMessage.length;
  for (let i = 0; i < length; i++) {
    const msg = roomStore.groupMessage[i];
    msg.top = height;
    total[i] = height;
    const current = roomStore.msgHeight.get(msg.msgId) ?? estiHeight;
    height = height + current;
  }
  console.log(111, "total", total);
  totalHeightSum.value = total;
}

function handleSendMessage() {
  if (isOpen.value) {
    if (!hasMore.value) return;
    const msg = {
      pageSize: 30,
      pageNum: pageNum++,
      type: "query",
    };
    sendMessage(JSON.stringify(msg));
  } else {
    console.log("WebSocket is not open.");
  }
}
</script>

<style scoped>
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
  transition: opacity 0.1s ease, transform 0.2s ease;
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
  transition: opacity 0.1s ease, transform 0.2s ease;
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
  transition: opacity 0.1s ease, transform 0.2s ease;
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
  transition: opacity 0.1s ease, transform 0.2s ease;
}
.msg-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.msg-list {
  position: relative;
}
</style>
