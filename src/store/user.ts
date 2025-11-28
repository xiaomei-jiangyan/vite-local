import { defineStore } from "pinia";

export type IUser = {
  userName: string;
  userId: string;
};

export const useUserStore = defineStore("user", {
  state: () =>
    ({
      token: localStorage.getItem("token") || "",
      user: null,
      role: "",
    } as {
      token: string;
      user: IUser | null;
    }),
  getters: {
    isLogin: (state) => !!state.token,
  },
  actions: {
    login(user: IUser, token: string) {
      this.token = token;
      localStorage.setItem("token", token);
      this.user = user;
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem("token");
    },
  },
});
