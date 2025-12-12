export const Preloader = {
  loaded: new Set(),
  load(src) {
    const image = new Image();
    image.src = src;
    this.loaded.add(src);
  },
  loadPopup(popup) {
    if (!popup?.content) return;
    popup.content.forEach((node) => {
      if (node.type === "image" && node.src) {
        if (!this.loaded.has(node.src)) this.load(node.src);
      }
    });
  },
};
