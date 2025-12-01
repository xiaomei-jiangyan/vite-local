<template>
  <div class="list-box">
    <div class="list-item" v-for="list in Lists" :key="list.title">{{ list.title }}</div>
  </div>
</template>
<script setup>
defineOptions({
  name: "Mine",
});
import { useRouter } from "vue-router";

const Lists = [
  {
    title: "我的角色",
    path: "/roles",
  },
  {
    title: "优惠券",
    path: "/quan",
  },
  {
    title: "我的形象",
    path: "/character",
  },
  {
    title: "设置",
    path: "/setting",
  },
];

function handleRedirect() {
  const router = useRouter();
  router.redirect({
    path: "/login",
  });
}
</script>
<style scoped>
.list-box {
  padding: 10px;
}
.list-item {
  border-bottom: 1px solid #eee;
  padding: 20px 0;
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>
