<template>
  <div class="header">
    <Icon v-if="icon" class="header-icon" :name="icon" @click="handleClick"></Icon>
    <i v-else @click="handleLogout" class="menu-icon"><span class="menu-icon-inner"></span></i>
    {{ title }}
  </div>
</template>
<script setup>
import { useUserStore } from "@/store/user";
import { useRouter, useRoute } from "vue-router";
import Icon from "@/components/Icon/Icon.vue";

defineProps({
  icon: String,
  title: {
    type: String,
    default: "",
  },
});
const router = useRouter();
const route = useRoute();
const user = useUserStore();

const handleLogout = () => {
  user.logout();
  router.replace("/login");
};

const handleClick = () => {
  router.back();
};
</script>
<style scoped>
.header-icon {
  position: absolute;
  left: 16px;
  font-size: 20px;
}
.menu {
  display: inline-block;
  width: 20px;
  border-top: 4px solid var(--thirdnary-border);
  border-bottom: 4px solid var(--thirdnary-border);
  height: 4px;
  margin: 10px 0;
  background: var(--thirdnary-bg);
  background-clip: content-box;
}

.header {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px var(--boxshadow);
  background: var(--thirdnary-bg);
}
.header .menu-icon {
  position: absolute;
  left: 10px;
}
</style>
