export function debounce(fn: Function, delay: number = 500) {
  let timer: number;
  return function (...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(null, args);
      clearTimeout(timer);
    }, delay);
  };
}

export function throttle(fn: Function, interval: number = 500) {
  let lastTime = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      fn.apply(null, args);
      lastTime = now;
    }
  };
}

export const isIos = () => {
  const ua = navigator.userAgent;

  // 传统 iOS 判断（iPhone/iPod/iPad）
  if (/iPhone|iPad|iPod/i.test(ua)) return true;

  // iPadOS 13+ 会伪装成 Mac，但触摸屏依然存在
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) {
    return true;
  }

  return false;
};

export const isAndroid = () => /Android/i.test(navigator.userAgent);

export function isMobile() {
  return isAndroid() || isIos();
}
const a = "这是一条新消息";

export const i18nText2 = `${a}, 收到`;
export const i18nText = "你好，我是尘";
