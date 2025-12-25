<script setup>
import { ref, provide, watch } from "vue";

// props 定义
const props = defineProps({
  modelValue: [String, Number, Boolean], // 单选框组的选中值
  name: String, // 单选框组的 name 属性
  disabled: Boolean, // 是否禁用
  rules: { type: Object, default: () => ({}) }, // 校验规则
});

// emits 定义
const emit = defineEmits(["update:modelValue"]);

// 内部值，用于双向绑定
const selectedValue = ref(props.modelValue);

// 当外层通过 v-model 改变 modelValue 时，保持内部 selectedValue 同步
watch(
  () => props.modelValue,
  (val) => {
    selectedValue.value = val;
  }
);

// 监听 selectedValue 的变化并向外 emit 更新
watch(selectedValue, (newValue) => {
  emit("update:modelValue", newValue);
});

// 向子组件提供当前 group 的值和禁用状态
provide("groupValue", selectedValue);
provide("groupDisabled", props.disabled);
</script>

<template>
  <div :class="['rgroup', { disabled: props.disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.rgroup {
  display: flex;
  flex: 1;
  gap: 20px;
  /* flex-direction: column; */
}

.rgroup.disabled {
  pointer-events: none;
}
</style>
