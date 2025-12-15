<template>
  <transition name="fade">
    <Teleport to="body" v-if="visible">
      <div class="popup-mask" @click="onMaskClick" v-if="schema">
        <div class="popup-container" @click.stop :style="schema.style">
          <template v-for="(node, index) in schema.content" :key="index">
            <component :is="resolveComponent(node)" :node="node" @action="emitAction" />
          </template>

          <div class="close-wrapper" :style="closePositionStyle">
            <div class="popup-close" @click="close">
              <span class="icon">×</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </transition>
</template>

<script setup>
import { ref, computed } from "vue";
import RenderImage from "./RenderImage.vue";
import RenderText from "./RenderText.vue";
import RenderButton from "./RenderButton.vue";
import PopupManager from "@/utils/popup-sdk";

const emit = defineEmits(["show", "close", "action"]);

const closePositionStyle = computed(() => {
  if (!schema.style?.closePosition) return null;
  const closePosition = schema.style.closePosition;
  switch (closePosition) {
    case "top-right": {
      return {
        right: "-12px",
        top: "-14px",
      };
    }
    case "top": {
      return {
        top: "-45px",
        right: 0,
        left: 0,
      };
    }
    case "top-left": {
      return {
        left: " -12px",
        top: "-14px",
      };
    }
    case "bottom": {
      return {
        bottom: "-45px",
        right: 0,
        left: 0,
      };
    }
    default:
      return null;
  }
});

const schema = ref();

const visible = ref(true);

const componentMap = {
  image: RenderImage,
  text: RenderText,
  button: RenderButton,
};

const resolveComponent = (node) => {
  return componentMap[node.type];
};

const close = () => {
  // 用户手动关闭
  visible.value = false;
  PopupManager.close(schema.value);
  emit("close");
};

const emitAction = (payload) => {
  PopupManager.click(schema.value);
  emit("action", payload);
};

const onMaskClick = close;

defineExpose({
  show: (schemaJSON) => {
    schema.value = schemaJSON;
    visible.value = true;
    emit("show");
  },
  close: () => {
    if (visible.value) {
      console.log("页面卸载时主动关闭，非用户关闭");
      visible.value = false;
      emit("close");
    }
  },
});
</script>

<style scoped>
.popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.03);
  display: flex;
  justify-content: center;
  align-items: center;
}
.popup-container {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  position: relative;
  text-align: center;
}
.close-wrapper {
  position: absolute;
  left: -12px;
  top: -14px;
}
.popup-close {
  border-radius: 50%;
  font-size: 16px;
  border: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
  margin: 0 auto;
}
.icon {
  height: 1.5em;
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.1s,
    transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(20px, 100px) scale(0.5);
}
</style>
