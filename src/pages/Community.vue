<template>
  <div class="community-page">
    <h1>Community Page</h1>
    <p>Welcome to the community page!</p>
    <button @click="goRoom">Chat</button>
    <button @click="goGroup">Group</button>
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
  router.push({ path: "/community/group" });
};

function handleRedirect() {
  const router = useRouter();
  router.redirect({
    path: "/login",
  });
}
</script>
