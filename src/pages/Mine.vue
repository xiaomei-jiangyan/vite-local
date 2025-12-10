<template>
  <div class="list-box">
    <div class="list-item" v-for="list in Lists" :key="list.title">{{ list.title }}</div>
    <div class="list-item" @click="handleDarkMode">
      Theme Mode
      <span>{{ theme === "dark" ? "黑暗模式" : "明亮模式" }}</span>
    </div>
  </div>
</template>
<script setup>
defineOptions({
  name: "Mine",
});
import { useRouter } from "vue-router";
import { useTheme } from "@/hooks/useTheme";

const [theme, setTheme] = useTheme();

const handleDarkMode = () => {
  // 设置黑暗模式
  console.log(111, "theme.value", theme.value);
  theme.value === "light" ? setTheme("dark") : setTheme("light");
};

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
  border-bottom: 1px solid var(--second-border);
  padding: 20px 0;
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>
