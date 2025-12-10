<template>
  <div class="ai-search">
    <div
      class="search-item"
      v-for="item in SearchData"
      :key="item.name"
      :class="{ hide: item.hide }"
    >
      <label class="search-label" :for="item.name">{{ item.label }}:</label>
      <component
        :is="item.component"
        v-bind="item.props"
        :name="item.name"
        :id="item.name"
        :value="search[item.name]"
        @change="handleChangeEvent($event, item)"
      ></component>
      <div class="error-text" v-if="item.error">{{ item.error }}</div>
    </div>
    <div class="button-wrapper">
      <div v-if="showSearch" class="button search-button" @click.enter="handleSearch">搜索</div>
      <div v-if="showReset" class="button reset-button" @click="handleReset">重置</div>
      <slot name="button"></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, PropType, watch, reactive, onMounted, onUnmounted } from "vue";
import type { ISearch } from "./type";
import { debounce } from "@/utils/index";

const emit = defineEmits(["search", "change", "reset", "update:modelValue"]);

type SearchProps = ISearch & {
  error?: string;
  hide?: boolean;
  // accept several possible dependency field spellings for backward compatibility
  dependencies?: string[];
};

const props = defineProps({
  searchs: {
    type: Array as PropType<SearchProps[]>,
    default: () => [],
  },
  modelValue: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
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

// reactive copy of the search definitions (so we can attach runtime fields like error)
const SearchData = ref<SearchProps[]>([]);

// current values object
const search = ref<Record<string, any>>({});
// initial values to support reset
const initialValues = ref<Record<string, any>>({});

// map to store per-field debounced handlers
const debounceMap = new Map<string, (...args: any[]) => void>();
const dependenciesMap = new Map<string, (() => Promise<void>)[]>();

const getValueFromEvent = (e: any, item: SearchProps) => {
  if (e === undefined || e === null) return e;
  if (typeof e !== "object") return e;
  // DOM event
  if (e.target && e.target.value) return e.target.value;
  // object with value
  if (typeof e.value !== "undefined") return e.value;
  // fallback to whole object
  if (typeof item.valueKey !== "undefined") {
    return e[item.valueKey];
  }
  return typeof e === "string" ? e : e.target.value;
};

const initFromProps = () => {
  // clear any previous dependency registrations
  dependenciesMap.clear();
  // make a reactive copy of searchs into array so we can mutate fields like .hide / .error
  SearchData.value = (props.searchs || []).map((s) =>
    reactive({ ...s, hide: false, error: "" } as SearchProps)
  );
  //  const arr = reactive(props.searchs || []);
  const vals: Record<string, any> = {};
  SearchData.value.forEach((item) => {
    const name = item.name;
    // priority: external modelValue > item.props.value > defaultValue > undefined
    if (props.modelValue && Object.prototype.hasOwnProperty.call(props.modelValue, name)) {
      vals[name] = props.modelValue[name];
    } else if (item.props && typeof item.props.value !== "undefined") {
      vals[name] = item.props.value;
    } else if (typeof item.props?.defaultValue !== "undefined") {
      vals[name] = item.props.defaultValue;
    } else {
      vals[name] = undefined;
    }
    const depsField = item.dependencies;

    if (Array.isArray(depsField)) {
      depsField.forEach((dep) => {
        const array = dependenciesMap.get(dep) ?? [];
        array.push(async () => await validatorField(item));
        dependenciesMap.set(dep, array);
      });
    }
  });
  initialValues.value = JSON.parse(JSON.stringify(vals));
  search.value = JSON.parse(JSON.stringify(vals));

  // emit initial model to parent so controlled mode stays in sync
  emit("update:modelValue", search.value);
};

// initialize on mount and whenever search definitions change
onMounted(initFromProps);
watch(
  () => props.searchs,
  () => {
    initFromProps();
  },
  { deep: true }
);

// watch external modelValue: if parent controls the values, sync into internal state
watch(
  () => props.modelValue,
  (nv) => {
    if (nv && typeof nv === "object") {
      search.value = { ...search.value, ...nv };
    }
  },
  { deep: true }
);

const handleChangeEvent = (e: any, item: SearchProps) => {
  // if (item.debounce) {
  //   const fn = createDebounced(item);
  //   fn(e);
  // } else {
  handleChange(e, item);
  // }
};

const createDebounced = (item: SearchProps) => {
  const name = item.name;
  if (debounceMap.has(name)) return debounceMap.get(name)!;
  const delay = typeof item.debounce === "number" ? item.debounce : 300;
  const fn = debounce((e: any) => handleChange(e, item), delay);
  debounceMap.set(name, fn);
  return fn;
};

const handleChange = async (e: any, item: SearchProps) => {
  const value = getValueFromEvent(e, item);
  // ensure we finish validating/updating this field before running dependents
  await validatorField(item, value);
  if (dependenciesMap.has(item.name)) {
    const deps = dependenciesMap.get(item.name);
    if (deps) deps.forEach((dep: () => Promise<void>) => dep());
  }
};

const validatorField = async (item: SearchProps, value = search.value[item.name]) => {
  search.value[item.name] = value;
  let invisible = false; // 不可见的
  if (typeof item.invisible !== "undefined") {
    if (typeof item.invisible === "function") {
      invisible = await item.invisible(search.value);
    } else {
      invisible = !!item.invisible;
    }
  }
  item.hide = !!invisible;
  if (invisible) {
    return;
  }
  let validate = true;
  if (item.validator) {
    if (item.validator instanceof RegExp) {
      validate = item.validator.test(value);
    } else {
      validate = await item.validator(search.value);
    }
  }
  if (!validate) {
    item.error = `校验失败`;
    return;
  }
  delete item.error;
  // always emit full modelValue and per-field change
  emit("update:modelValue", { ...search.value });
  emit("change", { name: item.name, value });
};

const handleSearch = () => {
  console.log("search.value ", search.value);
  emit("search", { ...search.value });
};

const handleReset = () => {
  search.value = JSON.parse(JSON.stringify(initialValues.value));
  // clear errors
  (SearchData.value || []).forEach((it) => {
    delete (it as SearchProps).error;
    delete (it as SearchProps).hide;
  });
  emit("update:modelValue", { ...search.value });
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

onUnmounted(() => {
  debounceMap.clear();
  dependenciesMap.clear();
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
  position: relative;
  padding-bottom: 20px;
  // &.show {
  //   display: flex;
  // }
  &.hide {
    display: none;
  }
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
  width: 100%;
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
.error-text {
  color: red;
  font-size: 10px;
  position: absolute;
  right: 0;
  bottom: 0;
}
</style>
