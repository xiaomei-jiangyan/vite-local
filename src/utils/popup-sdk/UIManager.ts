export const Manager = {
  quene: [] as any[],
  max: 1,
  start: 0,
  closePopup: () => {},
  current: null,
  openPopup: (...args: any[]): any => {},
  init(registerFunc = (...args: any[]) => {}) {
    this.openPopup = registerFunc;
  },
  pushQuene(i: any) {
    this.quene.push(i);
    this.processQuene();
  },
  getCurrent() {
    return this.current;
  },
  processQuene() {
    console.log("processQuene", this.start);
    if (this.start >= this.max) return;
    const quene = this.quene.shift();
    if (!quene) return;
    this.start++;
    this.current = quene;
    this.closePopup = this.openPopup(quene);
    return quene;
  },
  async next() {
    console.log("trigger next");
    if (typeof this.closePopup === "function") this.closePopup();
    this.current = null;
    await new Promise((r) => setTimeout(r, 300));
    this.start--;
    this.processQuene();
  },
};
