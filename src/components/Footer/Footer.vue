<template>
  <div class="footer">
    <div class="tabs-wrapper">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="tab tab-item"
        :class="{ active: isActive(tab.path) }"
      >
        <i v-if="tab.icon" :class="tab.icon"></i>
        <span>{{ tab.title }}</span>
      </router-link>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const tabs = [
  {
    title: "首页",
    tabIndex: 1,
    path: "/home",
  },
  {
    title: "社区",
    tabIndex: 2,
    path: "/community",
  },
  {
    title: "我的",
    tabIndex: 3,
    path: "/mine",
  },
];
const isActive = (path) => route.path === path;
</script>

<style scoped>
.footer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--thirdnary-bg);
  box-shadow: 0 -1px 4px var(--boxshadow);
}
.tabs-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
}
.tab {
  font-size: 16px;
  color: var(--text-color);
  text-align: center;
  flex: 1;
  line-height: 1;
  align-self: center;
}
.tab-item {
  padding: 15px 0;
  text-decoration: none;
  color: var(--text-color);
  transition: color 0.3s;
}
.tab:hover,
.tab-item.active {
  color: var(--second-text);
}
</style>
