<template>
  <Search v-if="searchs.length > 0" :searchs="searchs" v-model="search" />
  <div class="action-wrapper">
    <a-popover placement="topLeft">
      <template #content>
        <div
          class="column-button"
          v-for="col in columnKey"
          :key="col.title"
          @click="handleColShow(col)"
        >
          <span>{{ col.title }}</span>
          <a-checkbox v-if="col.selected" v-model:checked="col.selected"></a-checkbox>
        </div>
      </template>
      <a-button size="small" type="default">Setting</a-button>
    </a-popover>
    <a-popover placement="topLeft">
      <template #content>
        <div
          class="mode-button"
          :class="{
            current: mode === 'renderPagination',
          }"
          @click="handlePaginationMode"
        >
          <span>分页展示</span>
        </div>
        <div
          class="mode-button"
          :class="{
            current: mode === 'renderAdditional',
          }"
          @click="handleAddMode"
        >
          <span>往后追加</span>
        </div>
      </template>
      <a-button size="small" type="default">Mode</a-button>
    </a-popover>
    <a-button size="small" @click="handleExport">Export</a-button>
  </div>
  <div class="ai-table">
    <a-table v-bind="tableProps" :columns="columns" :dataSource="dataSource" :loading="loading">
      <template #bodyCell="{ column, record }">
        <template v-if="column.slot">
          <slot :name="column.slot" :record="record"></slot>
        </template>
      </template>
    </a-table>
  </div>
  <a-pagination
    class="ai-pagination"
    v-if="showPagination"
    @change="onPageChange"
    v-bind="pagination"
  ></a-pagination>
</template>
<script setup lang="ts">
import { useUserStore } from "@/store/user";
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { IColumn, ITable } from "./type";
import { Key } from "ant-design-vue/es/vc-table/interface";
import { useTableStore, exportCSV } from "./table";
import Search from "./Search.vue";

// 2) 使用 defineProps<Type>() 与 withDefaults 合并默认值
// 客户端分页 , 分页缓存 / 状态保持 ,导出 CSV / Excel
const props = withDefaults(defineProps<ITable>(), {
  auto: true,
  method: "GET",
  showPagination: true,
  pageSizeIternal: "pageSize",
  pageNumIternal: "pageNum",
  showHeader: true,
  bordered: true,
  clientPagination: false,
} as const);
console.log("props", props);
const { auto, method, showPagination, pageSizeIternal, pageNumIternal, ...tableProps } = props;

const dataSource = ref<any[]>([]);
const loading = ref(false);
const total = ref(0);
const pageSize = ref(props.pageSize ?? 10);
const pageNum = ref(1);
const mode = ref<"renderAdditional" | "renderPagination">(
  props.renderAdditional ? "renderAdditional" : "renderPagination"
);

const selectColumns = computed(() => {
  const keys = columnKey.value
    .map((item) => (item.selected ? (item.key as string) : undefined))
    .filter(Boolean) as Key[];
  const set = new Set(keys);
  return set;
});

const columns = computed(() => {
  return [
    ...(props.columns ?? []).map((column) => {
      if (selectColumns.value.has(column.key as Key)) {
        return column;
      }
    }),
  ].filter(Boolean);
});

const columnKey = ref(
  (props.columns ?? [])
    .map((item) => {
      if (!item.invisible)
        return {
          title: item.title,
          key: item.key,
          selected: true,
          dataIndex: item.dataIndex,
        } as any;
    })
    .filter(Boolean)
);

const searchs = ref(
  (props.columns ?? [])
    .map((item) => {
      if (item.search)
        return {
          ...item.search,
          label: item.title,
          name: item.key,
        } as any;
    })
    .filter(Boolean)
);

const pagination = computed(() => ({
  total: total.value,
  current: pageNum.value,
  pageSize: pageSize.value,
}));

const handleColShow = (col: IColumn & { selected: boolean }) => {
  col.selected = !col.selected;
};

const search = ref({});

const cacheMap = new Map();

const { save: saveQuery, get: getQuery } = useTableStore(props.storageQuery);

// const fetchData = (body: any) => {
//   const user = useUserStore();

//   if (props.customRequest) {
//     return props.customRequest(body);
//   } else {
//     function getOption() {
//       const options = {
//         token: user.token,
//         method: props.method,
//         ...body,
//       } as any;
//       let url = props.action;
//       if (props.method === "POST") {
//         options.body = JSON.stringify(options);
//         options.headers = {
//           "Content-Type": "application/json",
//         };
//       } else {
//         const queryString = Object.keys(options).reduce((prev, next, index) => {
//           return prev + `${next}=${options[next]}${index !== options.length - 1 ? "&" : ""}`;
//         }, "?");
//         // const queryString = new URLSearchParams(options).toString();
//         url += `${queryString}`;
//         options.url = url;
//       }
//       return options;
//     }
//     const { url, ...options } = getOption();
//     const mapKey = `${JSON.stringify(options)}`;
//     if (cacheMap.has(mapKey)) {
//       const response = cacheMap.get(mapKey);
//       return response.status === "success"
//         ? Promise.resolve(response.data)
//         : Promise.reject(response.data);
//     }
//     return fetch(url, options)
//       .then((res) => {
//         if (!res.ok) {
//           throw new Error("Network response was not ok");
//         }
//         return res.json();
//       })
//       .then((data) => {
//         if (props.cache) {
//           cacheMap.set(mapKey, {
//             status: "success",
//             data: {
//               list: data.list,
//               total: data.total ?? data.list.length,
//             },
//           });
//         }
//         return data;
//       })
//       .catch((e) => {
//         if (props.cache) {
//           cacheMap.set(mapKey, {
//             status: "failed",
//             data: e,
//           });
//         }
//         return Promise.reject(e);
//       });
//   }
// };

async function fetchData(body: Object) {
  const user = useUserStore();
  const urlBase = props.action;
  const payload: Record<string, any> = { ...body };

  const method = (props.method || "GET").toUpperCase();
  const headers: any = { Accept: "application/json" };
  if (user.token) headers["Authorization"] = `Bearer ${user.token}`;

  let url = urlBase;
  const fetchOpts: any = { method, headers };

  if (method === "POST") {
    fetchOpts.body = JSON.stringify(payload);
    fetchOpts.headers["Content-Type"] = "application/json";
  } else {
    const urlObj = new URL(url, window.location.origin);
    Object.keys(payload).forEach((k) => {
      if (payload[k] !== undefined) urlObj.searchParams.set(k, String(payload[k]));
    });
    url = urlObj.toString();
  }

  const res = await fetch(url, fetchOpts);
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

const fetchRequest = async () => {
  try {
    if (loading.value) return;
    loading.value = true;
    let body = {
      ...search.value,
      pageSize: pageSize.value,
      pageNum: pageNum.value,
    };
    if (props.beforeRequest) {
      // 必须要return一个有效值
      body = await props.beforeRequest(body);
    }

    if (!body) return;

    let res = await fetchData(body);
    await props.afterRequest?.(res);
    if (mode.value === "renderAdditional") {
      // 往后追加
      dataSource.value = [...dataSource.value, ...res.data] as any[];
    } else {
      dataSource.value = res.data;
    }
    total.value = res.total || dataSource.value.length;
  } catch (e) {
    //
  } finally {
    loading.value = false;
    // 如果
    // if (mode.value === "renderAdditional") pageNum.value++;
  }
};

const onPageChange = (page: number, size: number) => {
  console.log(111, "page", page, size);
  pageSize.value = size;
  pageNum.value = page;
  fetchRequest();
};

const handleAddMode = () => {
  mode.value = "renderAdditional";
};

const handlePaginationMode = () => {
  mode.value = "renderPagination";
};

const handleExport = () => {
  exportCSV(columns.value, dataSource.value);
};

onMounted(() => {
  if (props.storageQuery) {
    const res = getQuery();
    if (res) {
      const { pageSize: size, pageNum: num, columnKey: key, ...others } = res;
      pageNum.value = num;
      pageSize.value = size;
      search.value = others;
      columnKey.value = key;
    }
  }
  fetchRequest();
});

onUnmounted(() => {
  cacheMap.clear();
  if (props.storageQuery)
    saveQuery({
      pageSize: pageSize.value,
      pageNum: pageNum.value,
      columnKey: columnKey.value,
      ...search.value,
    });
});
</script>
<style scoped lang="less">
.ai-table {
  height: 87%;
  overflow-y: auto;
  position: relative;
}
.action-wrapper {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.ai-pagination {
  margin-top: 10px;
  text-align: right;
}
.column-button {
  cursor: pointer;
  display: flex;
  gap: 4px;
  align-items: center;
}
.mode-button {
  color: #333;
  cursor: pointer;
  &.current {
    color: blue;
  }
}
.ai-pagination {
  position: absolute;
  bottom: 20px;
  right: 10px;
}
</style>
