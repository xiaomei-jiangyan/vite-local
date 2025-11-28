<template>Error, no Permission</template>
<script setup>
import { useRouter } from "vue-router";

function handleRedirect() {
  const router = useRouter();
  router.redirect({
    path: "/login",
  });
}
</script>
