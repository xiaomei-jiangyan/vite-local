<template>
  <input class="" v-model="value" />
</template>
<script setup>
const props = defineProps({
  class: {
    type: String,
    default: "",
  },
  modelValue: {
    type: String | Number,
    default: "",
  },
});
const value = ref();
</script>
<style scoped></style>
