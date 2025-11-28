<template>
  <form>
    <slot></slot>
  </form>
</template>
<script setup lang="ts">
import { ref, provide, reactive, onUnmounted } from "vue";
import type { IRule, IField } from "./type";

const props = defineProps({
  model: {
    type: Object,
    default: () => ({}),
  },
  rules: {
    type: Object,
    default: () => [],
  },
});

const error = reactive(new Map<string, string>());
const fields = reactive<IField[]>([]);
const emit = defineEmits(["submit", "error"]);

const registerField = (field: IField) => {
  fields.push(field);
};

const unRegisterField = (name: string) => {
  const index = fields.findIndex((i) => i.name === name);
  fields.splice(index, 1);
};

const validateField = async (name: string) => {
  const field = fields.find((item) => item.name === name);
  if (!field) return true;
  const rules = props.rules?.[field.name] ?? field.rules ?? [];
  if (!rules.length) return true;
  const value = props.model?.[field.name];
  for (let rule of rules) {
    const errorMsg = rule.message ?? "请输入";
    if (rule.required && !value) {
      error.set(field.name, errorMsg);
      return false;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      error.set(field.name, errorMsg);
      return false;
    }
    if (rule.type && typeof value !== rule.type) {
      error.set(field.name, errorMsg);
      return false;
    }
    if (rule.validator) {
      const res = await rule.validator(value);
      if (!res) {
        error.set(field.name, errorMsg);
        return false;
      }
    }
    error.delete(field.name);
    return true;
  }
};

const validate = async () => {
  const promises = fields.map((field) => {
    return validateField(field.name);
  });
  const result = await Promise.all(promises);
  return result.every(Boolean);
};

const getFieldsValue = async () => {
  const validateStatus = await validate();
  let values = null;
  if (validateStatus) {
    values = fields.reduce((prev, next) => {
      const key = next.name;
      const value = props.model?.[key];
      prev[key] = value;
      return prev;
    }, {} as any);
  } else {
    emit("error", getFieldErrors());
  }
  return values;
};

const getFieldErrors = () => {
  const errors = [...error].reduce((prev, next) => {
    const key = next[0];
    const value = next[1];
    prev[key] = value;
    return prev;
  }, {} as any);
  return errors;
};

provide("AFormContext", {
  error: error,
  model: props.model,
  unRegisterField,
  registerField,
  validateField,
});

defineExpose({
  validate,
  getFieldsValue,
});
</script>
