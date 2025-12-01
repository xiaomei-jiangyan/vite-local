<template>
  <div class="community-page">
    <h1>Community Page</h1>
    <p>Welcome to the community page!</p>
    <button class="button" @click="goRoom">Chat</button>
    <button class="button" @click="goGroup">Group</button>
  </div>
</template>
<script setup>
import { useRouter } from "vue-router";

defineOptions({
  name: "Community",
});
const router = useRouter();

const goRoom = () => {
  router.push({ path: "/community/room" });
};

const goGroup = () => {
  router.push({ path: "/community/virtual" });
};

function handleRedirect() {
  const router = useRouter();
  router.redirect({
    path: "/login",
  });
}
</script>
<style scoped>
.community-page {
  padding: 10px;
}
.button {
  margin: 0 10px;
  border-radius: 5px;
  border: none;
  background: #3f86ff;
  color: #fff;
  padding: 12px 18px;
}
</style>
