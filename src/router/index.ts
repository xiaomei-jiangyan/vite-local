// @ts-nocheck
import { createRouter, createWebHistory } from "vue-router";
import { baseRouters } from "./router";
import { useUserStore } from "@/store/user";

const router = createRouter({
  history: createWebHistory(),
  routes: baseRouters,
});

const whiteList: any[] = [];

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  if (whiteList.includes(to.path)) {
    next();
  } else if (to.meta.requireAuth && !userStore.isLogin) {
    console.log("go login", to.fullPath);
    // 未登录跳转登录页
    next({ path: "/login", query: { redirect: to.fullPath } });
  } else if (to.meta.roles && !to.meta.roles.includes(userStore.role)) {
    next("/403");
  } else {
    next();
  }
});

export default router;
