// @ts-nocheck
import Home from "@/pages/Home.vue";
import Login from "@/pages/Login.vue";
import NotFound from "@/pages/NotFound.vue";
import Error from "@/pages/Error.vue";
import Community from "@/pages/Community.vue";
import Mine from "@/pages/Mine.vue";
import Room from "@/pages/Room/Room.vue";
import Group from "@/pages/Room/Group.vue";
import VirtualGroup from "@/pages/Virtual/Group.vue";

export const pageRoutes = [
  {
    path: "/",
    redirect: "/home",
    meta: {
      title: "Home",
      keepAlive: true,
      requireAuth: true,
    },
  },
  {
    path: "/home",
    component: Home,
    name: "Home",
    meta: {
      title: "Home",
      keepAlive: true,
      requireAuth: true,
    },
  },
  {
    path: "/community",
    component: Community,
    name: "Community",
    meta: {
      title: "Community",
      keepAlive: true,
      requireAuth: true,
    },
  },
  {
    path: "/community/room",
    component: Room,
    name: "Room",
    meta: {
      title: "Room",
      keepAlive: true,
      tabbar: false,
      requireAuth: true,
    },
  },
  {
    path: "/community/group",
    component: Group,
    name: "Group",
    meta: {
      title: "Group",
      keepAlive: true,
      tabbar: false,
      requireAuth: true,
    },
  },
  {
    path: "/community/virtual",
    component: VirtualGroup,
    name: "VirtualGroup",
    meta: {
      title: "VirtualGroup",
      keepAlive: true,
      tabbar: false,
      requireAuth: true,
    },
  },
  {
    path: "/mine",
    component: Mine,
    name: "Mine",
    meta: {
      title: "Mine",
      keepAlive: true,
      requireAuth: true,
    },
  },
];

export const baseRouters = [
  { path: "/login", component: Login },
  { path: "/403", component: Error },
  { path: "/404", component: NotFound },
  ...pageRoutes,
];
