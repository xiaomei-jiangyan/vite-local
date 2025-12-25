<template>
  <div class="scrollbar" ref="wrapper">
    <div class="lists-wrapper">
      <transition-group name="msg" tag="div" class="msg-list">
        <div
          class="msg-item"
          v-for="msg in store.message"
          :key="msg.msgId"
          :class="{ isSelf: msg.isSelf }"
        >
          <div class="msg-card">
            <span v-if="msg.isSelf">{{ msg.message }}</span>
            <TypeMessage v-else :message="msg.message" />
          </div>
        </div>
      </transition-group>
    </div>
    <SendInput @send="handleSendMessage" />
  </div>
</template>

<script setup>
import { onMounted, ref, onActivated, nextTick, onUnmounted } from "vue";
import SendInput from "./SendInput.vue";
import TypeMessage from "./TypeMessage.vue";
import { debounce } from "@/utils/index";
import { useWebSocket } from "@/hooks/useWebsocket";
import { useRoomStore } from "@/store/room";
import { useUserStore } from "@/store/user";
import { ChatMessage } from "./ChatMessage.js";

defineOptions({
  name: "Home",
});

const store = useRoomStore();
const userStore = useUserStore();

defineProps({
  msg: String,
});

const ChatManager = new ChatMessage(userStore.user?.userId ?? "");

let timer = null;

const renderMsg = () => {
  if (timer) clearTimeout(timer);
  const msg = ChatManager.getMessage();
  if (msg) {
    store.saveMsg({ ...msg, isSelf: false });
    timer = setTimeout(() => {
      renderMsg();
    }, 400); // 每400毫秒检查一次消息队列
  } else {
    clearTimeout(timer);
  }
};

const { isOpen, sendMessage, close } = useWebSocket("ws://192.168.0.103:8080?room=1", {
  autoReconnect: true,
  reconnectInterval: 3000,
  onMessage: (event) => {
    const msg = JSON.parse(event.data);
    // console.log("onMessage msg:", event.data);
    ChatManager.receiveMessage(msg);
    renderMsg();
    scrollToBottom();
  },
});

// 滚动到最底部的函数
const scrollToBottom = () => {
  nextTick(() => {
    if (wrapper.value) {
      // 使用 scrollHeight 和 scrollTop 来实现滚动
      wrapper.value.scrollTop = wrapper.value.scrollHeight;
    }
  });
};

const handleSendMessage = (message) => {
  if (isOpen.value) {
    const { userId, username } = userStore.user ?? {};
    const msg = {
      msgId: Date.now().toString(),
      message,
      userId: userId,
      username: username,
    };
    sendMessage(JSON.stringify(msg));
    store.saveMsg({ ...msg, isSelf: true });
    scrollToBottom();
  } else {
    console.log("WebSocket is not open.");
  }
};

const wrapper = ref(null);
let savedScrollTop = 0;

function onScroll() {
  savedScrollTop = wrapper.value.scrollTop; // 实时记录
}

const debounceScroll = debounce(onScroll);

onMounted(() => {
  wrapper.value.addEventListener("scroll", debounceScroll);
});

onUnmounted(() => {
  wrapper.value?.removeEventListener("scroll", debounceScroll);
  close();
});

onActivated(() => {
  wrapper.value.scrollTop = savedScrollTop;
});

const lists = ref([]);
const loadMore = ref(null);

// const [pageChange, { loading, error, hasMore }] = usePagination("/api/water", {
//   method: "POST",
//   headers: {
//     "content-type": "application/json",
//   },
// });

// const fetchData = async () => {
//   const res = (await pageChange()) ?? [];
//   lists.value = [...lists.value, ...res];
// };

onMounted(() => {
  // const observer = new IntersectionObserver(([entry]) => {
  //   if (entry.isIntersecting) {
  //     fetchData();
  //   }
  // });
  // observer.observe(loadMore.value);
});
</script>

<style scoped>
.scrollbar {
  width: 100%;
  height: 100%;
  -webkit-overflow-scrolling: touch;
  overflow: hidden;
  overflow-y: auto;
}

.lists-wrapper {
  padding: 0.5rem;
  /* display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)); 两列等宽
  gap: 0.6rem; */
  box-sizing: border-box;
}

.msg-card {
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 12px;
  color: #333;
  margin: 10px 5px;
  border: 1px solid #e0e0e0;
  display: inline-block;
  max-width: 70%;
  word-wrap: break-word;
}

.msg-item {
  /* make the item a block so transform/translate works predictably */
  display: block;
  margin: 6px 0;
}

.isSelf {
  text-align: right;
}

.isSelf .msg-card {
  background-color: #d1e7dd;
}

.loadMore {
  text-align: center;
  margin-bottom: 0.5rem;
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
</style>
