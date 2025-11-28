<template>
  <div>
    <span>404 Not Found</span>
    <Button @click="handleRedirect">Redirect</Button>
  </div>
</template>
<script setup>
import { useRouter } from "vue-router";

function handleRedirect() {
  const router = useRouter();
  router.redirect({
    path: "/login",
  });
}
</script>
