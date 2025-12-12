<template>
  <button class="popup-button" :style="{ ...node.style }" @click="onClick">
    {{ node.text }}
  </button>
</template>

<script setup>
const props = defineProps({ node: Object });
const emit = defineEmits(["action"]);

const onClick = () => {
  emit("action", props.node.action);
};
</script>
<style>
.popup-button {
  border: none;
  padding: 4px 12px;
  border-radius: 12px;
}
</style>
