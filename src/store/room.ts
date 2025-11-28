import { defineStore } from "pinia";

export type IMessage = {
  message: string;
  userId: string;
  msgId: string;
  username: string;
  done?: boolean;
};

export const useRoomStore = defineStore("room", {
  state: () => ({
    message: [] as IMessage[],
    groupMessage: [] as IMessage[],
    msgHeight: new Map<string, number>(),
  }),
  getters: {},
  actions: {
    saveMsg(message: IMessage) {
      const exists = this.message.findIndex((msg) => msg.msgId === message.msgId);
      if (exists !== -1) {
        this.message[exists] = { ...this.message[exists], ...message };
      } else {
        this.message.push(message);
      }
    },
    batchSave(msgs: IMessage[]) {
      this.groupMessage.unshift(...msgs.reverse());
    },
    saveGroupMsg(message: IMessage) {
      const exists = this.groupMessage.findIndex((msg) => msg.msgId === message.msgId);
      if (exists !== -1) {
        this.groupMessage[exists] = { ...this.groupMessage[exists], ...message };
      } else {
        this.groupMessage.unshift(message);
      }
    },
    saveMsgHeight(id: string, height: number) {
      this.msgHeight.set(id, height);
    },
  },
});
