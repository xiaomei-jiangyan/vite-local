<template>
  <p :style="{ ...node.style }">{{ node.value }}</p>
</template>

<script setup>
const props = defineProps({ node: Object });
</script>
