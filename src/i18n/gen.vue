<template>
  <div class="community-page">
    <p title="{{$t('Community.3')}}">{{ $t("Community.4") }}</p>
    <h1>Community Page</h1>
    <p>Welcome to the community page!</p>
    <p>{{ text }}</p>
    <button title="{{$t('Community.5')}}" class="button" @click="goRoom">Chat</button>
    <button class="button" @click="goGroup">Group</button>
    <p>{{ $t("Community.6") }} {{ varible }}{{ $t("Community.7") }}</p>
  </div>
</template>
<script setup>
import { i18n } from "@/i18n/index";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const text = ref("");
const varible = i18n.global.t("Community.1");

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

onMounted(() => {
  text.value = i18n.global.t("Community.2", { _0: varible });
});
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
