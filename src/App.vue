<script setup>
import { computed } from "vue";
import Layout from "./pages/Layout.vue";
import { useTheme } from "@/hooks/useTheme";
import { theme, ConfigProvider } from "ant-design-vue";

const darkTheme = theme.darkAlgorithm;
const defaultTheme = theme.defaultAlgorithm;

const [themeMode, setTheme] = useTheme();

setTheme();

const computedTheme = computed(() => ({
  algorithm: themeMode.value === "dark" ? darkTheme : defaultTheme,
}));
</script>

<template>
  <ConfigProvider :theme="computedTheme">
    <Layout />
  </ConfigProvider>
</template>

<style scoped></style>
