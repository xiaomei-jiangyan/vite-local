export const Fetcher = {
  getPopupList(url = "/api/popup", options) {
    return fetch(url, options)
      .then((res) => res.json())
      .then((res) => res.data);
  },
};
