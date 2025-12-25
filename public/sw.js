// const VERSION = "v1.0.0";
// const STATIC_CACHE = "static-v1";
// const API_CACHE = "api-v1";
// const IMG_CACHE = "img-v1";

// // 接口用 NetworkFirst + Cache Fallback，图片用 StaleWhileRevalidate，静态资源 CDN 用 CacheFirst
// const CACHE_WHITELIST = ["static-v1", "api-v1", "img-v1"];

// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches
//       .open(STATIC_CACHE)
//       .then((cache) => cache.addAll(["/", "/index.html", "/src/main.js", "/src/style.css"]))
//   );
// });
// self.addEventListener("fetch", (event) => {
//   const { request } = event;
//   const url = new URL(request.url);
//   console.log("services.worker request fetch");
//   if (url.pathname.startsWith("/@vite")) {
//     return; // 直接走网络
//   }
//   //对静态资源采用 Cache First 策略，显著提升二次访问性能
//   if (request.destination === "script" || request.destination === "style") {
//     event.respondWith(
//       caches.match(request).then((cacheRes) => {
//         return cacheRes || fetch(request);
//       })
//     );
// return
//   }
//   // 弱网 / 断网还能看到历史数据
//   // 接口请求采用 Network First + Cache Fallback，保障弱网可用性
//   if (request.url.includes("/api/")) {
//     event.respondWith(
//       fetch(request)
//         .then((res) => {
//           const clone = res.clone();
//           caches.open(API_CACHE).then((c) => c.put(request, clone));
//           return res;
//         })
//         .catch(() => caches.match(request))
//     );
// return
//   }

//   // 对图片资源采用 Stale-While-Revalidate 策略，优化图片流性能
//   // 图片秒开
//   // 滚动列表更丝滑
//   // 弱网不白屏
//   if (request.destination === "image") {
//     event.respondWith(
//       caches.match(request).then((cacheRes) => {
//         const fetchPromise = fetch(request).then((res) => {
//           caches.open(IMG_CACHE).then((c) => c.put(request, res.clone()));
//           return res;
//         });

//         return cacheRes || fetchPromise;
//       })
//     );
// return;
//   }

//   if (event.request.mode === "navigate") {
//     event.respondWith(
//       caches.match("/index.html").then((res) => {
//         return res || fetch(event.request);
//       })
//     );
//     return;
//   }

//   event.respondWith(
//     caches.match(event.request).then((res) => {
//       return res || fetch(event.request);
//     })
//   );
// });

// // 设计缓存版本控制与自动清理机制，避免缓存污染
// self.addEventListener("activate", (event) => {
//   event.waitUntil(
//     caches.keys().then((keys) =>
//       Promise.all(
//         keys.map((key) => {
//           if (!CACHE_WHITELIST.includes(key)) {
//             return caches.delete(key);
//           }
//         })
//       )
//     )
//   );
// });

// //实现 Service Worker 无感更新与平滑切换
// skipWaiting() → 新 SW 立即进入 activate 状态
// 页面可以通过 navigator.serviceWorker.controller 监听 controllerchange → 刷新页面或重新渲染
// self.addEventListener("message", (e) => {
//   if (e.data === "SKIP_WAITING") {
//     self.skipWaiting();
//   }
// });

/// <reference lib="webworker" />
// offline fallback 页面
// ✔ 手动清缓存指引
// ✔ disable-sw 开关（紧急降级）
// if (location.search.includes('disable_sw')) {
//   navigator.serviceWorker.getRegistrations()
//     .then(rs => rs.forEach(r => r.unregister()))
// }

import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
// IndexedDB 工具
import { addToQueue, getAllQueue, clearQueue } from "./sw-idb";

import { setCatchHandler } from "workbox-routing";

// Warm the cache when the service worker installs
self.addEventListener("install", (event) => {
  const files = ["/offline.html"]; // you can add more resources here
  event.waitUntil(self.caches.open("offline-fallbacks").then((cache) => cache.addAll(files)));
});

setCatchHandler(async (options) => {
  const destination = options.request.destination;
  const cache = await self.caches.open("offline-fallbacks");
  if (destination === "document") {
    return (await cache.match("/offline.html")) || Response.error();
  }
  return Response.error();
});

// let self: ServiceWorkerGlobalScope

// clientsClaim();

// 1️⃣ Workbox 预缓存
precacheAndRoute(self.__WB_MANIFEST);

// 2️⃣ GET 接口缓存（继续用 Workbox）
registerRoute(
  ({ url, request }) => request.method === "GET" && url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 3,
  })
);

// 3️⃣ POST 离线队列（继承在 Workbox 体系里）
// registerRoute(
//   ({ url, request }) => request.method === "POST" && url.pathname === "/api/water",

//   async ({ event }) => {
//     try {
//       return await fetch(event.request);
//     } catch {
//       const body = await event.request.clone().json();

//       await addToQueue({
//         url: event.request.url,
//         method: event.request.method,
//         headers: [...event.request.headers],
//         body,
//         time: Date.now(),
//       });

//       return new Response(
//         JSON.stringify({
//           offline: true,
//           message: "已离线保存，网络恢复后自动提交",
//         }),
//         {
//           status: 202,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }
//   },
//   "POST"
// );

registerRoute(
  /\/api\/.*$/,
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 300,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  "GET"
);

registerRoute(
  /\.(png|jpg|jpeg|webp|svg|gif)$/,
  new StaleWhileRevalidate({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 604800,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  "GET"
);

registerRoute(
  /^https:\/\/cdn\.example\.com\/.*\.(woff2|woff|js|css)$/,
  new CacheFirst({
    cacheName: "cdn-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 2592e3,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  "GET"
);

registerRoute(
  ({ request: s }) => "navigate" === s.mode,
  new NetworkFirst({
    cacheName: "html-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  "GET"
);

// self.addEventListener("sync", (event) => {
//   if (event.tag === "post-queue-sync") {
//     event.waitUntil(replayQueue());
//   }
// });

// async function replayQueue() {
//   const queue = await getAllQueue();

//   for (const item of queue) {
//     try {
//       await fetch(item.url, {
//         method: item.method,
//         headers: item.headers,
//         body: JSON.stringify(item.body),
//       });
//     } catch {
//       return;
//     }
//   }

//   await clearQueue();
// }
