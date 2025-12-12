<template>
  <div class="community-page">
    <p title="标题">这是中文消息，哈哈哈哈</p>
    <h1>大标题</h1>
    <p>欢迎来到这里</p>
    <p>{{ text }}</p>
    <button title="私人聊天" class="button" @click="goRoom">私聊</button>
    <button class="button" @click="goGroup">群聊</button>
    <button class="button" @click="goTable">Table</button>
    <p>我是 {{ varible }},你是谁呀</p>
    <Search :searchs="searchs" />
  </div>
</template>
<script setup>
import { onMounted, inject, computed, onDeactivated, ref, markRaw } from "vue";
import { useRouter } from "vue-router";
import Search from "@/components/Table/Search.vue";
import { Input } from "ant-design-vue";
import { useFetch } from "@/hooks/useFetch";
import CustomInput from "@/components/Table/CustomInput.vue";
import { PopupManager, PopupSDK } from "@/utils/popup-sdk";

const Toast = inject("toast");

// 数据接口联动功能
// 记住当前页面的查询参数，方便跳转回来的时候回填 checked
const searchs = computed(() => {
  return [
    {
      label: "姓名",
      name: "name",
      component: "AInput", // markRaw(Input)
      props: {
        defaultValue: "王三",
        allowClear: true,
        showCount: true,
      },
      dependencies: ["age"],
      // invisible: (form) => form.age > 15,
      debounce: 500,
    },
    {
      label: "年龄",
      name: "age",
      component: markRaw(Input),
      // validator: (value) => value <= 13,
      props: {
        allowClear: true,
        defaultValue: 14,
      },
      debounce: 800,
    },
    {
      label: "年级",
      name: "class",
      component: "ASelect", // markRaw(Input)
      dependencies: [
        {
          field: "age",
          fn: fetchOption,
        },
      ],
      props: {
        style: { width: "120px" },
        options: options.value,
        defaultValue: options.value[0]?.value,
      },
    },
    {
      label: "定制化",
      name: "customs",
      component: markRaw(CustomInput), // markRaw(Input)
      // dependencies: [
      //   {
      //     field: "age",
      //     fn: fetchOption,
      //   },
      // ],
      props: {
        allowClear: true,
        defaultValue: 123,
      },
    },
  ];
});

const text = ref("");
const varible = "奇迹温暖";

defineOptions({
  name: "Community",
});
const router = useRouter();

const options = ref([]);

const goRoom = () => {
  router.push({ path: "/community/room" });
};

const [fetchUser, { loading, error }] = useFetch("/api/option", {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
});

const fetchOption = async (query) => {
  options.value = await fetchUser(query);
};

const goGroup = () => {
  router.push({ path: "/community/virtual" });
};

const goTable = () => {
  router.push({ path: "/community/table" });
};

onMounted(() => {
  console.log("community emit");
  PopupSDK.trigger("community_enter");
});

onDeactivated(() => {
  const current = PopupManager.getCurrent();
  if (current) PopupSDK.close(current);
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
  background: var(--common-button-bg);
  color: #fff;
  padding: 12px 18px;
}
</style>
