import { reactive, toRefs } from "vue";

export function useRoomStore() {
  const state = reactive({
    messages: [],
    msgHeight: new Map(),
    prefixHeights: [0], // 前缀高度数组，第 0 项 = 0
  });

  return {
    ...toRefs(state),

    // 设置某条消息的高度
    setMsgHeight(id, height) {
      state.msgHeight.set(id, height);
      this.rebuildPrefix();
    },

    // 重新计算前缀高度
    rebuildPrefix() {
      const result = [0];
      let sum = 0;

      state.messages.forEach((msg) => {
        sum += state.msgHeight.get(msg.msgId) ?? 80;
        result.push(sum);
      });

      state.prefixHeights = result;
    },

    // 模拟加载历史
    insertMsgs(list) {
      state.messages.unshift(...list.reverse());
      this.rebuildPrefix();
      return list;
    },
  };
}
