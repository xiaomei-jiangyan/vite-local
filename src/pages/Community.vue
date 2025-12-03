<template>
  <div class="community-page">
    <p title="标题">这是中文消息，哈哈哈哈</p>
    <h1>大标题</h1>
    <p>欢迎来到这里</p>
    <p>{{ text }}</p>
    <button title="私人聊天" class="button" @click="goRoom">私聊</button>
    <button class="button" @click="goGroup">群聊</button>
    <p>我是 {{ varible }},你是谁呀</p>
  </div>
</template>
<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const text = ref("");
const varible = "奇迹温暖";

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
  text.value = `你好，这是${varible}社区生活!!!欢迎您！`;
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
