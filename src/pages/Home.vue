<template>
  <div class="scrollbar" ref="wrapper">
    <div class="lists-wrapper">
      <div v-for="list in lists" :key="list.id" class="list-card">
        <img :src="list.profile.src" />
        <span class="title">{{ list.username }}</span>
      </div>
    </div>
    <div class="loadMore" ref="loadMore">{{ hasMore ? "Load More..." : "No More Data" }}</div>
  </div>
</template>

<script setup>
import { onMounted, ref, onActivated, onDeactivated, onUnmounted } from "vue";
import { usePagination } from "@/hooks/usePagination";
import { debounce } from "@/utils/index";

defineOptions({
  name: "Home",
});
defineProps({
  msg: String,
});

const wrapper = ref(null);
let savedScrollTop = 0;

// onDeactivated(() => {
//   savedScrollTop = wrapper.value.scrollTop;
//   console.log(111, "onDeactivated", savedScrollTop, wrapper.value, wrapper.value.scrollTop);
// });

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

onActivated(() => {
  wrapper.value.scrollTop = savedScrollTop;
});

const lists = ref([]);
const loadMore = ref(null);

const [pageChange, { loading, error, hasMore }] = usePagination("/api/water", {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
});

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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)); /* 两列等宽 */
  gap: 0.6rem;
  box-sizing: border-box;
}

.list-card {
  /* width: 50%; */
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* padding-top: 0.3rem; */
  padding-bottom: 0.3rem;
  box-shadow: 0 2px 4px var(--boxshadow);
}

.list-card img {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border: none;
  min-height: 300px;
}

.list-card .title {
  font-size: 16px;
  color: var(--text-color);
  margin-left: 5px;
  margin-top: 10px;
}

.loadMore {
  text-align: center;
  margin-bottom: 0.5rem;
}
</style>
