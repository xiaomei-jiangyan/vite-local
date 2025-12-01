<template>
  <div class="msg-card" ref="card" :data-id="msg.msgId">
    <div class="bubble" :class="{ self: msg.isSelf }">
      <div v-if="msg.src" class="img-wrapper" :style="{ paddingBottom: imgPadding }">
        <img v-if="cachedSrc" :src="cachedSrc" class="image" />
      </div>
      <span v-else>{{ msg.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick, watch } from "vue";
import * as store from "./ImageStore";

const props = defineProps({
  msg: Object,
});

const emit = defineEmits(["updateHeight"]);
const card = ref(null);
const imgPadding = ref("0%"); // 控制占位比例

const observer = ref(null);
const cachedSrc = ref(null);

onMounted(async () => {
  await nextTick();
  if (props.msg.src) {
    const meta = await store.loadImageMeta(props.msg.src);
    imgPadding.value = `${meta.ratio * 100}%`;
    cachedSrc.value = await store.loadImage(props.msg.src);
  }
  observer.value = new ResizeObserver((el) => {
    const offsetHeigth = el.offsetHeight ?? 80;
    emit("updateHeight", props.msg.msgId, offsetHeigth);
  });
  if (card.value instanceof Element) {
    observer.value.observe(card.value);
  }
});
</script>

<style scoped>
.img-wrapper {
  position: relative;
  width: 100px;
}
.image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* .image {
  height: 100px;
  object-fit: cover;
  border: none;
} */
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
