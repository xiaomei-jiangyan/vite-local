<template>
  <div class="ai-search">
    <div class="search-item" v-for="item in props.searchs" :key="item.name">
      <label class="search-label" :for="item.name">{{ item.label }}:</label>
      <component
        :is="item.component"
        v-bind="item.props"
        :name="item.name"
        :id="item.name"
        @change="
          item.debounce
            ? debounce(() => handleChange($event, item), item.debounce)
            : handleChange($event, item)
        "
      ></component>
    </div>
    <div class="button-wrapper">
      <div v-if="showSearch" class="button search-button" @click.enter="handleSearch">搜索</div>
      <div v-if="showReset" class="button reset-button" @click="handleReset">重置</div>
      <slot name="button"></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, PropType, watch, watchEffect, onMounted } from "vue";
import type { ISearch } from "./type";
import { debounce } from "@/utils/index";

const emit = defineEmits(["search", "change", "reset", "update:modelValue"]);
const props = defineProps({
  searchs: {
    type: Array as PropType<ISearch[]>,
    default: () => [],
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  showReset: {
    type: Boolean,
    default: true,
  },
});

const search = ref<any>({});

watch(
  () => props.searchs,
  (newValue) => {
    if (Array.isArray(newValue)) {
      newValue.forEach((item) => {
        search.value[item.name] = item.props.value;
      });
    }
  }
);

const setDefaultValue = () => {
  const newValue = props.searchs;
  if (Array.isArray(newValue)) {
    newValue.forEach((item) => {
      search.value[item.name] = item.props.defaultValue;
    });
  }
};

onMounted(() => {
  setDefaultValue();
});

const handleChange = (e: any, item: ISearch) => {
  const value = typeof e === "string" ? e : item.valueKey ? e[item.valueKey] : e.target.value;
  search.value[item.name] = value;
  if (typeof item.props.value !== "undefined") {
    emit("update:modelValue", value);
  }
  emit("change", { name: item.name, value });
};

const handleSearch = () => {
  console.log(111, JSON.stringify(search.value));
  emit("search", search.value);
};

const handleReset = () => {
  setDefaultValue();
  emit("reset");
};

defineExpose({
  reset: handleReset,
  getValues: () => search.value,
  focusField: (fieldName: string) => {
    const ele = document.querySelector(`#${fieldName}`) as HTMLInputElement;
    if (ele) ele.focus();
  },
});
</script>
<style scoped lang="less">
.ai-search {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.search-item {
  display: flex;
  gap: 5px;
  font-size: 14px;
  color: #eee;
  margin: 10px;
}
.search-label {
  min-width: 80px;
  display: flex;
  align-items: center;
  /* // justify-content: center; */
}
.button-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  .button {
    padding: 8px 12px;
    border-radius: 8px;
  }
  .search-button {
    background: #585aa4;
  }
  .reset-button {
    border: 1px solid #585aa4;
  }
}
</style>
