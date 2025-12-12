<template>
  <div class="table-page">
    <Table
      action="/api/table"
      storageQuery="tableIndex"
      :size="small"
      :columns="columns"
      :pageSize="10"
    >
      <template #action="{ record }">
        <button @click="handleGoPrivate(record.id)">Private</button>
      </template>
    </Table>
  </div>
</template>
<script setup>
import { useRouter } from "vue-router";
import { Input } from "ant-design-vue";
import Table from "@/components/Table/Table.vue";
defineOptions({
  name: "Table",
});
const router = useRouter();

const columns = [
  {
    title: "姓名",
    key: "username",
    dataIndex: "username",
    align: "center",
    search: {
      component: "AInput", // markRaw(Input)
      props: {
        defaultValue: "王1",
        allowClear: true,
        showCount: true,
      },
      dependencies: ["age"],
      invisible: (form) => form.age > 15,
    },
  },

  {
    title: "年龄",
    key: "age",
    search: {
      component: "AInput", // markRaw(Input)
      props: {
        allowClear: true,
      },
      // validator: (value) => value <= 13,
    },
    dataIndex: "age",
    align: "center",
  },
  {
    title: "年级",
    key: "class",
    invisible: true, // 不可见的 true
    search: {
      component: "ASelect", // markRaw(Input)
      props: {
        allowClear: true,
        style: { width: "120px" },
        options: [
          {
            label: "123",
            value: "456",
          },
        ],
      },
    },
  },
  {
    title: "地址",
    key: "address",
    dataIndex: "address",
    align: "center",
  },
  {
    title: "邮箱",
    key: "email",
    dataIndex: "email",
    align: "center",
  },
  {
    title: "头像",
    key: "profile",
    dataIndex: "profile",
    align: "center",
  },
  {
    title: "随机数",
    key: "randomCode",
    dataIndex: "randomCode",
    align: "center",
  },
  {
    title: "操作",
    key: "action",
    dataIndex: "action",
    slot: "action",
    align: "center",
  },
];

const handleGoPrivate = () => {
  router.push({ path: "/community/room" });
};
</script>
<style scoped>
.table-page {
  padding: 10px 10px;
  height: 100%;
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
