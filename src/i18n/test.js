import { parse } from "@vue/compiler-sfc";

const content = `<style></style>
  <template>
   <div>哈哈哈</div>
  </template>
  <script lang='ts'>var a =1</script>`;
const sfc = parse(content);
const script = sfc.descriptor.script;

const pos = sfc.descriptor.script.loc.start.offset;
console.log("pos", pos); // 输出类似 40
console.log("content", content.slice(pos - 18));
