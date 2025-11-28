export class ChatMessage {
  // 接收ws到来的消息并按msgId分类
  // 暴露给外部取出消息的方法
  msgQuene: any[] = [];
  userId;
  constructor(userId: string) {
    this.userId = userId;
  }

  receiveMessage(data: { msgId: string; message: string; userId: string; done: boolean }) {
    const { msgId, message } = data;
    const index = this.msgQuene.findIndex((msg: any) => msg.msgId === msgId);
    if (index > -1) {
      this.msgQuene[index] = data;
    } else {
      this.msgQuene.push(data);
    }
  }

  getMessage() {
    const current = this.msgQuene[0];
    if (current && current.done) {
      this.msgQuene.splice(0, 1);
    }
    return current;
  }
}
