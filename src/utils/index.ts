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
