export const Storage = {
  storageKey: "popup_activity",
  storage: (() => {
    try {
      const res = JSON.parse(localStorage.getItem("popup_activity")) ?? {};
      return res;
    } catch (e) {
      console.log(e);
      return {};
    }
  })(),
  get(key) {
    if (this.storage[key]) return this.storage[key];
    const cache = localStorage.getItem(this.storageKey);
    try {
      const value = JSON.parse(cache);
      return value[key];
    } catch (e) {
      return cache?.[key];
    }
  },
  set(key, value) {
    this.storage[key] = value;
    localStorage.setItem(this.storageKey, JSON.stringify(this.storage));
  },
};
