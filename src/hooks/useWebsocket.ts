import { ref, onMounted, onBeforeUnmount, watch } from "vue";

export type WebSocketOptions = {
  autoReconnect?: boolean; // 是否自动重连
  retry?: number; // 重连次数
  reconnectInterval?: number; // 重连间隔时间，单位毫秒
  onOpen?: (event: Event) => void; // 连接打开时的回调
  onMessage?: (event: MessageEvent) => void; // 接收到消息时的回调
  onError?: (event: Event) => void; // 连接错误时的回调
  onClose?: (event: CloseEvent) => void; // 连接关闭时的回调
};

export function useWebSocket(url: string, options?: WebSocketOptions) {
  // WebSocket 实例
  const ws = ref<WebSocket | null>(null);

  // WebSocket 连接状态
  const isOpen = ref(false);
  const isReconnecting = ref(false); // 是否正在重连

  let retry = options?.retry || 3;

  let timer: ReturnType<typeof setTimeout>;
  // 连接 WebSocket
  const connect = () => {
    if (ws.value) return; // 防止重复连接

    ws.value = new WebSocket(url);

    // WebSocket 连接打开时
    ws.value.onopen = (event) => {
      console.log("ws onopen", event);
      isOpen.value = true;
      isReconnecting.value = false; // 停止重连状态
      options?.onOpen?.(event);
      console.log("WebSocket connected");
    };

    // WebSocket 接收到消息时
    ws.value.onmessage = (event) => {
      options?.onMessage?.(event);
    };

    // WebSocket 错误时
    ws.value.onerror = (error) => {
      options?.onError?.(error);
      reconnect();
      console.error("WebSocket error:", error);
    };

    // WebSocket 连接关闭时
    ws.value.onclose = (event) => {
      isOpen.value = false;
      // reconnect();
      options?.onClose?.(event);
      console.log("WebSocket disconnected");
    };
  };

  // 发送消息
  const sendMessage = (message: string) => {
    if (ws.value && isOpen.value) {
      ws.value.send(message);
    } else {
      console.error("WebSocket is not open");
    }
  };

  const reconnect = () => {
    if (options?.autoReconnect) {
      if (isReconnecting.value) return; // 防止重复重连
      isReconnecting.value = true;
      timer = setTimeout(() => {
        if (retry <= 0) {
          clearTimeout(timer);
          console.log("Max reconnection attempts reached.");
          return;
        }
        console.log("Reconnecting WebSocket...");
        connect();
        retry = retry - 1;
      }, options?.reconnectInterval || 5000);
    }
  };

  // 关闭连接
  const close = () => {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
  };

  // 在组件挂载时连接 WebSocket
  onMounted(() => {
    connect();
  });

  // 在组件卸载时关闭 WebSocket 连接
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer); // 清理重连定时器
    close();
  });

  // 当 URL 改变时重新连接 WebSocket
  watch(
    () => url,
    () => {
      close();
      connect();
    }
  );

  return {
    isOpen,
    sendMessage,
    close,
    reconnect,
  };
}
