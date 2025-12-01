<template>
  <div class="app-wrapper safe-area" role="region" aria-label="App safe area">
    <div v-if="user.isLogin" class="app-navbar nav-bar">
      <Header :title="route.meta.title" :icon="route.meta.icon" />
    </div>
    <main
      class="content scrollable"
      :class="{ full: user.isLogin, 'with-tabbar': route.meta.tabbar !== false }"
    >
      <router-view v-slot="{ Component }">
        <template v-if="route.meta.keepAlive">
          <keep-alive :include="cacheList">
            <component :is="Component" />
          </keep-alive>
        </template>
        <component v-else :is="Component" />
      </router-view>
    </main>
    <footer v-if="user.isLogin && route.meta.tabbar !== false" class="app-bottombar bottom-bar">
      <Footer />
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import Header from "@/components/Header/Header.vue";
import Footer from "@/components/Footer/Footer.vue";
import { useUserStore } from "@/store/user";
import { useRoute } from "vue-router";

defineProps({
  msg: String,
});

// tabbar 三个组件需要缓存
const cacheList = ["Home", "Mine"];

const route = useRoute();
console.log("layout route", route);
const user = useUserStore();

onMounted(() => {});
</script>
<style scoped>
/* 兼容旧 WebKit 的 safe-area 处理（iOS 11-12） */
.safe-area {
  padding-top: env(safe-area-inset-top, 0);
  padding-right: env(safe-area-inset-right, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-left: env(safe-area-inset-left, 0);

  /* 旧兼容写法（部分旧版本 WebKit） */
  padding-top: constant(safe-area-inset-top);
  padding-right: constant(safe-area-inset-right);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-left: constant(safe-area-inset-left);
}

/* 常用顶部导航高度，叠加 safe-area */
.nav-bar {
  height: calc(44px + env(safe-area-inset-top, 0));
  padding-top: env(safe-area-inset-top, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  z-index: 998;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

/* 底部操作栏（Home 指示器） */
.bottom-bar {
  height: calc(50px + env(safe-area-inset-bottom, 0));
  padding-bottom: env(safe-area-inset-bottom, 0);
  /* Safari 老版本兼容 */
  padding-bottom: constant(safe-area-inset-bottom, 0);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--color-bg);
  z-index: 998;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

/* 让滚动区拥有原生惯性（iOS） */
.scrollable {
  -webkit-overflow-scrolling: touch;
  /** 子元素自己继承高度实现滚动 */
  overflow: hidden;
}

.scrollable.full {
  padding-top: calc(44px + env(safe-area-inset-top, 0));
}
.scrollable.with-tabbar {
  padding-bottom: calc(50px + env(safe-area-inset-bottom, 0));
}
/* .scrollable.full ~ .app-bottombar {
} */
/** app样式 */
.app-wrapper {
  display: flex;
  height: 100vh;
  box-sizing: border-box;
  flex-direction: column;
}

.content {
  flex: 1;
}
</style>
