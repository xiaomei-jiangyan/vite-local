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
import { onMounted, ref, nextTick, watch, onUnmounted } from "vue";
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
  observer.value = new ResizeObserver((entries) => {
    // const offsetHeigth = el.offsetHeight ?? 80;
    requestAnimationFrame(() => {
      const { width, height = 80 } = entries[0].contentRect;
      emit("updateHeight", props.msg.msgId, height);
    });
  });
  if (card.value instanceof Element) {
    observer.value.observe(card.value);
  }
});
onUnmounted(() => {
  if (card.value) observer.value?.unobserve(card.value);
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
  background: var(--thirdnary-bg);
}

.bubble.self {
  background: var(--second-bg);
  float: right;
}
</style>
