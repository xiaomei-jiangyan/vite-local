<template>
  <div class="scrollbar" ref="wrapper">
    <div class="lists-wrapper">
      <div v-for="(list, index) in lists" :key="list.id" class="list-card">
        <HomeCard :list="list" :high="index <= 1" />
      </div>
    </div>
    <div class="loadMore" ref="loadMore">{{ hasMore ? "Load More..." : "No More Data" }}</div>
  </div>
</template>

<script setup>
import { onMounted, ref, onActivated, onDeactivated, onUnmounted } from "vue";
import { usePagination } from "@/hooks/usePagination";
import { debounce } from "@/utils/index";
import PopupManager from "@/utils/popup-sdk";
import HomeCard from "./HomeCard.vue";

defineOptions({
  name: "Home",
});
defineProps({
  msg: String,
});

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
});

const lists = ref([]);
const loadMore = ref(null);

const [pageChange, { loading, error, hasMore }] = usePagination("/api/water");

const fetchData = async () => {
  const res = (await pageChange()) ?? [];
  lists.value = [...lists.value, ...res];
};

onMounted(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      fetchData();
    }
  });
  observer.observe(loadMore.value);
  PopupManager.trigger("home_enter");
});

onActivated(() => {
  wrapper.value.scrollTop = savedScrollTop;
});

onDeactivated(() => {
  PopupManager.close();
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
  padding: 10px; /** 1rem => 20px */
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)); /* 两列等宽 */
  gap: 0.6rem;
  box-sizing: border-box;
}

.list-card {
  /* width: 50%; */
  /*@ts-ignore */
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* padding-top: 0.3rem; */
  padding-bottom: 0.3rem;
  box-shadow: 0 2px 4px var(--boxshadow);
}

.loadMore {
  text-align: center;
  margin-bottom: 0.5rem;
}
</style>
