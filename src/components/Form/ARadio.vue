<script setup lang="ts">
import { computed, inject } from "vue";
// @ts-ignore
import RadioGroup from "@/components/Radio/Group.vue";
// @ts-ignore
import Radio from "@/components/Radio/Radio.vue";

const { model, validateField } = inject("AFormContext") as any;

type IOption = {
  value: string | number | boolean;
  label: string;
};

const props = defineProps({
  labelName: String,
  Options: {
    type: Array<IOption>,
    default: () => [],
  },
});

// 选中的值
const value = computed({
  get: () => (props.labelName ? model[props.labelName] : ""),
  set: (v: any) => {
    props.labelName && (model[props.labelName] = v);
    validateField(props.labelName);
  },
});
</script>

<template>
  <RadioGroup v-model="value" :name="labelName">
    <Radio
      v-for="option in Options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </RadioGroup>
</template>
