<template>
  <img class="image" :data-src="list.profile.color" ref="ele" />
  <!-- <img class="image" :src="list.profile.color" /> -->
  <span class="title">{{ list.username }}</span>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import scheduler from "./ImageLoader";

const props = defineProps({
  list: Object,
  high: Boolean,
});

const ele = ref(null);
let io;

onMounted(() => {
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const src = e.target.dataset.src;
        if (e.isIntersecting) {
          scheduler
            .load(src, props.high)
            .then((img) => {
              if (img.blobUrl) {
                e.target.src = img.blobUrl;
              } else {
                e.target.src = img.src;
              }
            })
            .catch((e) => {
              console.log(e);
            });
        } else {
          scheduler.abort(src);
        }
      });
    },
    {
      rootMargin: "400px",
    }
  );
  if (ele.value) io.observe(ele.value, { once: true });
});

onUnmounted(() => {
  if (ele.value && io) io.unobserve(ele.value);
});
</script>
<style scoped>
.image {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border: none;
  min-height: 300px;
}
.title {
  font-size: 16px;
  color: var(--text-color);
  margin-left: 5px;
  margin-top: 10px;
}
</style>
