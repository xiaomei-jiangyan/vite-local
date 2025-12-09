<script setup>
import Layout from "./pages/Layout.vue";
import { useTheme } from "@/hooks/useTheme";

const [theme, setTheme] = useTheme();
setTheme();
</script>

<template>
  <Layout />
</template>

<style scoped></style>
