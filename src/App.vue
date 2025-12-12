<script setup>
import { computed, onMounted, ref } from "vue";
import Layout from "./pages/Layout.vue";
import { useTheme } from "@/hooks/useTheme";
import { theme, ConfigProvider } from "ant-design-vue";
import Popup from "@/components/Popup/Popup.vue";
import { PopupSDK, PopupManager } from "@/utils/popup-sdk";

const darkTheme = theme.darkAlgorithm;
const defaultTheme = theme.defaultAlgorithm;

const [themeMode, setTheme] = useTheme();

setTheme();

const computedTheme = computed(() => ({
  algorithm: themeMode.value === "dark" ? darkTheme : defaultTheme,
}));

const popupRef = ref();

PopupSDK.init({
  api: "/api/popup",
  preload: true,
  report: (type, data) => {
    // sendToLogServer(type, data);
    console.log("上报服务器", type, data);
  },
});

PopupManager.init((popup) => {
  popupRef.value.show(popup);
  return () => {
    if (popupRef.value) popupRef.value.close(popup);
  };
});
</script>

<template>
  <ConfigProvider :theme="computedTheme">
    <Layout />
    <Popup ref="popupRef" />
  </ConfigProvider>
</template>

<style scoped></style>
