// worker.js
self.onmessage = (e) => {
  const messages = e.data; // 接收数组 [{id, text}, ...]

  const result = messages.map((msg) => {
    // 简单富文本解析示例
    let html = msg.text
      .replace(/:\)/g, "😊")
      .replace(/:\(/g, "😞")
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    return { id: msg.id, html };
  });

  self.postMessage(result);
};
