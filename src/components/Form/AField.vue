<template>
  <div class="field" :class="name">
    <label :for="name" class="label">{{ label }}:</label>
    <slot v-if="hasDefaultSlot" :labelName="name" :value="value" :placeholder="placeholder"></slot>
    <input
      v-else
      class="input"
      :name="name"
      type="text"
      :placeholder="placeholder"
      v-model="value"
    />
    <div class="error" v-if="errorMsg">{{ errorMsg }}</div>
  </div>
</template>
<script setup lang="ts">
import { computed, useSlots, inject, onMounted, onUnmounted } from "vue";
import type { IRule } from "./type";

const { error, model, validateField, registerField, unRegisterField } = inject(
  "AFormContext"
) as any;

const props = defineProps({
  name: String,
  label: String,
  required: Boolean,
  rules: {
    type: Array<IRule>,
    default: () => [],
  },
  placeholder: String,
});

const slots = useSlots();

// ✅ 判断默认 slot 是否传入内容
const hasDefaultSlot = computed(() => {
  return slots.default && slots.default().length > 0;
});

onMounted(() => {
  const rules = props.rules ?? [];
  if (props.required) {
    rules.push({
      required: true,
    });
  }
  registerField({
    name: props.name,
    rules,
  });
});

onUnmounted(() => {
  unRegisterField(props.name);
});

const value = computed({
  get: () => (props.name ? model[props.name] : ""),
  set: (v: any) => {
    props.name && (model[props.name] = v);
    validateField(props.name);
  },
});

const errorMsg = computed(() => {
  return props.name ? error[props.name] : "";
});
</script>
<style scoped>
.field {
  display: flex;
  gap: 10px;
  margin: 10px 0;
  width: 100%;
  align-items: center;
}
.field label {
  min-width: 80px;
  display: inline-block;
  vertical-align: middle;
}

.field input {
  display: inline-block;
  border: 1px solid var(--second-border);
  box-shadow: 0 1px 4px var(--boxshadow);
  padding: 8px 10px;
  border-radius: 10px;
  outline: none;
}
</style>
