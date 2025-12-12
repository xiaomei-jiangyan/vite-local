<template>
  <div class="custom-ele">
    <input class="custom-input" @input="onInput" v-bind="$attrs" />
    <div title="输入项的2-4位" class="extra">{{ text }}</div>
  </div>
</template>
<script setup>
import { onMounted, ref, watch, useAttrs } from "vue";
const props = defineProps();
const attrs = useAttrs();

const text = ref("");

onMounted(() => {
  // 声明的props会进入props，其他则以attr属性接收
  // console.log(props, attrs);
});
watch(
  () => attrs.value,
  (newValue) => {
    text.value = typeof newValue === "string" ? newValue.slice(2, 4) : "";
  }
);

// 子组件自己维护一份modelvalue
// ！！！重置的时候就需要暴露一份重置的方法对外，方便父组件管理
// const props = defineProps({
//   value: {
//     type: [String, Number],
//     default: "",
//   },
// });
// const attrs = useAttrs();
// const localValue = ref(props.value);

// watch(
//   () => props.value,
//   (newV) => {
//     localValue.value = newV;
//   }
// );
// const emit = defineEmits(["change"]);

// function onInput(e) {
//   const v = e.target.value;
//   localValue.value = v;
//   text.value = v.slice(2, 4);
//   emit("change", v);
// }
</script>
<style>
.custom-ele {
  color: #333;
  position: relative;
}
.custom-input {
  padding: 10px;
  border-radius: 10px;
  /* border: none; */
  outline: none;
  font-size: 14px;
  color: #333;
}
.extra {
  position: absolute;
  bottom: 0;
  right: 10px;
}
</style>
