<script setup>
import { inject, computed, ref, watch } from "vue";

// 从 RadioGroup 获取 group 的值和禁用状态
// provide 的通常是一个 ref; 使用默认值以防未被包裹在 Group 中
const groupValue = inject("groupValue", null);
const groupDisabled = inject("groupDisabled", false);

// props 定义（加入 name 以便同组原生行为也能工作）
const props = defineProps({
  name: String,
  label: String, // 单选框的 label
  value: [String, Number, Boolean], // 单选框自身对应的 value
  disabled: Boolean, // 是否禁用
});

// emits 定义
const emit = defineEmits(["update:modelValue"]);

// 如果 groupValue 存在，就直接使用它（它是一个 ref），否则使用组件本地的 ref
const localValue = ref(props.value);
const currentValue = groupValue ?? localValue; // currentValue 是一个 ref

// 当值变化时通知父组件（并且如果是 groupValue，这会同步到 Group 的 selectedValue）
watch(currentValue, (newValue) => {
  emit("update:modelValue", newValue);
});

// 计算禁用状态和选中状态
const isDisabled = computed(() => !!groupDisabled || !!props.disabled);
</script>

<template>
  <div :class="['aradio', { disabled: isDisabled }]">
    <input
      type="radio"
      v-model="currentValue"
      :value="props.value"
      :name="props.name"
      :disabled="isDisabled"
    />
    <label>{{ props.label }}</label>
  </div>
</template>

<style scoped>
.aradio {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.aradio label {
  margin-left: 8px;
  font-size: 14px;
}

.aradio input:disabled + label {
  color: #ccc;
}

.aradio input:checked + label {
  font-weight: bold;
}

.aradio.disabled {
  pointer-events: none;
}
</style>
