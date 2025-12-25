import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import i18nDynamicPlugin from "./src/plugins/vite-plugin-i18n-dynamic";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    i18nDynamicPlugin("src/locales"),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   includeAssets: ["favicon.svg"],
    //   manifest: {
    //     name: "Vite Vue PWA",
    //     short_name: "VitePWA",
    //     start_url: "/",
    //     display: "standalone",
    //   },
    //   devOptions: {
    //     enabled: true, // 允许 dev 下注册（⚠️ 不是完整离线）
    //   },
    //   workbox: {
    //     navigateFallback: "/index.html",
    //     runtimeCaching: [
    //       {
    //         urlPattern: ({ url }) => url.pathname === "/api/water",
    //         handler: async ({ event }) => {
    //           // POST 请求专用处理
    //           if (event.request.method === "POST") {
    //             try {
    //               return await fetch(event.request);
    //             } catch {
    //               return new Response(JSON.stringify({ offline: true }), {
    //                 status: 503,
    //                 headers: { "Content-Type": "application/json" },
    //               });
    //             }
    //           }

    //           // 其他请求走默认 NetworkFirst
    //           return fetch(event.request);
    //         },
    //         method: "POST", // ⚠️ 指定只拦截 POST
    //       },
    //       // 1️⃣ API 接口请求
    //       {
    //         urlPattern: /\/api\/.*$/,
    //         handler: "NetworkFirst",
    //         options: {
    //           cacheName: "api-cache",
    //           networkTimeoutSeconds: 3, // 3秒内没网络就 fallback 缓存
    //           expiration: {
    //             maxEntries: 50, // 最多缓存50条接口
    //             maxAgeSeconds: 60 * 5, // 缓存5分钟
    //           },
    //           cacheableResponse: { statuses: [0, 200] },
    //         },
    //       },
    //       // 2️⃣ 图片资源
    //       {
    //         urlPattern: /\.(png|jpg|jpeg|webp|svg|gif)$/,
    //         handler: "StaleWhileRevalidate",
    //         options: {
    //           cacheName: "image-cache",
    //           expiration: {
    //             maxEntries: 100,
    //             maxAgeSeconds: 60 * 60 * 24 * 7, // 7天
    //           },
    //           cacheableResponse: { statuses: [0, 200] },
    //         },
    //       },
    //       // 3️⃣ 第三方 CDN 文件（字体 / lib）
    //       {
    //         urlPattern: /^https:\/\/cdn\.example\.com\/.*\.(woff2|woff|js|css)$/,
    //         handler: "CacheFirst",
    //         options: {
    //           cacheName: "cdn-cache",
    //           expiration: {
    //             maxEntries: 30,
    //             maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
    //           },
    //           cacheableResponse: { statuses: [0, 200] },
    //         },
    //       },
    //       // 4️⃣ HTML 页面导航请求（SPA）
    //       {
    //         urlPattern: ({ request }) => request.mode === "navigate",
    //         handler: "NetworkFirst",
    //         options: {
    //           cacheName: "html-cache",
    //           networkTimeoutSeconds: 5,
    //           expiration: {
    //             maxEntries: 10,
    //           },
    //           cacheableResponse: { statuses: [0, 200] },
    //         },
    //       },
    //     ],
    //   },
    // }),
    VitePWA({
      selfDestroying: true,
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",
      devOptions: {
        enabled: true,
      },
      includeAssets: ["vite.svg"],
      manifest: {
        icons: [
          {
            src: "vite.svg",
            sizes: "any",
          },
        ],
      },

      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg}"],
      },
      workbox: {
        // navigateFallbackDenylist: [/./],
        globIgnores: ["version.json", "404.html", "index.html"],
        runtimeCaching: [
          {
            urlPattern: /favicon.svg/,
            handler: "NetworkFirst",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://192.168.0.103:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id.split("node_modules/")[1].split("/")[0];
          }
        },
      },
    },
  },
});
