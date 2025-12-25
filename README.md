# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

基于 Service Worker + Cache Storage 实现 首屏资源缓存与离线访问，
首页二次访问加载时间降低 40%+

基于 Vite + PWA（Workbox）构建前端离线与缓存解决方案，
自动生成 Service Worker 并实现运行时缓存策略，
支持资源版本控制、无感更新与离线访问，
在弱网环境下显著提升页面可用性与加载性能。

<!-- PWA + 登录态 / Token 缓存安全怎么处理
2️⃣ Service Worker 为什么不适合缓存某些接口（反面案例）
3️⃣ 把这套方案画成一张“架构图”，教你怎么讲 -->
