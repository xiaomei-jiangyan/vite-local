<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="toast-box">
        <span class="title">
          <Icon :name="title" />
        </span>
        {{ message }}
      </div>
    </transition>
  </teleport>
</template>
<script setup>
import { computed, ref } from "vue";
import Icon from "../Icon/Icon.vue";

const message = ref("");
const status = ref("info");
const visible = ref(false);

const title = computed(() => {
  const keys = {
    error: "error",
    success: "success",
    warn: "info",
    info: "info",
  };
  return keys[status.value] ?? "信息";
});

const show = (item) => {
  message.value = item.message;
  visible.value = true;
  status.value = item.status;
};

const hide = () => {
  visible.value = false;
};

defineExpose({ show, hide });
</script>
<style scoped>
/* .toast-box {
  position: fixed;
  z-index: 998;
  padding: 5px 8px;
  top: 50px;
  left: 50%;
  border-radius: 5px;
  transform: translateX(-50%);
  border: 1px solid #efefef;
  box-shadow: 1px 1px 0px 0px #e5c5d5; 
transition: all 0.3s ease;
/* opacity: 0; 
  color: #333;
  background: #fefefe;
} */
.toast-box {
  position: fixed;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 16px;
  background: var(--thirdnary-bg);
  color: white;
  border-radius: 6px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.title {
  font-size: 16px;
  color: var(--color-bg);
  vertical-align: middle;
  /* // font-size: 20px; */
}
</style>
