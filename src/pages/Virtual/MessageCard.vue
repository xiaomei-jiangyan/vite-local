<template>
  <div class="msg-card" ref="card" :data-id="msg.msgId">
    <div class="bubble" :class="{ self: msg.isSelf }">
      {{ msg.message }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from "vue";

const props = defineProps({
  msg: Object,
});

const emit = defineEmits(["updateHeight"]);
const card = ref(null);

onMounted(async () => {
  await nextTick();
  const h = card.value?.offsetHeight ?? 80;
  emit("updateHeight", props.msg.msgId, h);
});
</script>

<style scoped>
.msg-card {
  padding: 6px 10px;
}

.bubble {
  display: inline-block;
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  background: #eee;
}

.bubble.self {
  background: #acf;
  float: right;
}
</style>
