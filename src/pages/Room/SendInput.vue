<template>
  <div class="send-input">
    <input
      type="text"
      @keyup.enter="handleSend"
      v-model="message"
      placeholder="Type your message..."
    />
    <button @click="handleSend">Send</button>
  </div>
</template>
<script setup>
import { ref } from "vue";
const message = ref("");

const emit = defineEmits(["send"]);

const handleSend = () => {
  if (message.value.trim() !== "") {
    emit("send", message.value.trim());
    message.value = "";
  }
};
</script>
<style scoped>
.send-input {
  display: flex;
  gap: 6px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--second-bg);
  padding: 10px 10px;
  z-index: 9998;
  padding-bottom: calc(15px + env(safe-area-inset-bottom, 0));
  box-shadow: 0 -1px 5px var(--boxshadow);
}
.send-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--second-color);
  border-radius: 8px;
  box-shadow: inset 0 1px 3px var(--boxshadow);
  font-size: 14px;
}
.send-input button {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background-color: var(--thirdnary-color);
  color: white;
}
</style>
