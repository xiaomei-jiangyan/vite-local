<template>
  <div
    class="msg-item"
    ref="item"
    :data-height="msg.height"
    :data-id="msg.msgId"
    :class="{ isSelf: msg.isSelf, enter: animate }"
  >
    <div class="msg-card">
      <span>{{ msg.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoomStore } from "@/store/room";

const props = defineProps({
  msg: Object,
  setRealHeight: Function,
});
const roomStore = useRoomStore();
const item = ref(null);
const animate = ref(false);

onMounted(() => {
  registerHeight();
  requestAnimationFrame(() => {
    animate.value = true;
  });
});

function registerHeight() {
  const ro = new ResizeObserver(() => {
    if (item.value) props.setRealHeight?.(props.msg.msgId, item.value.offsetHeight);
    if (item.value) roomStore.saveMsgHeight(props.msg.msgId, item.value.offsetHeight);
  });
  ro.observe(item.value);
}
</script>
<style scoped>
.isSelf .msg-card {
  background-color: #d1e7dd;
}

.msg-item.enter {
  opacity: 1;
  transform: translateY(0);
}

.msg-item {
  /* make the item a block so transform/translate works predictably */
  display: block;
  position: relative;
  /* will-change: top;
  transition: top 0.2s ease; */
  padding: 6px 0;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.25s ease;
}

.msg-card {
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 12px;
  color: #333;
  margin: 5px;
  border: 1px solid #e0e0e0;
  display: inline-block;
  max-width: 70%;
  word-wrap: break-word;
}
</style>
