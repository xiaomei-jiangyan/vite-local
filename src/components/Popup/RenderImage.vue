<template>
  <img :src="node.src" :style="{ ...node.style }" />
</template>

<script setup>
defineProps({ node: Object });
</script>
