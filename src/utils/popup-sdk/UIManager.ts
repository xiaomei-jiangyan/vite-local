export default class Manager {
  quene: any[];
  max: number;
  start: number;
  current: null;
  showPopup: Function;
  sdk: any;
  closePopup: Function;
  delay: string[];
  constructor(sdk: any) {
    this.sdk = sdk;
    this.quene = [] as any[];
    this.max = 1;
    this.start = 0;
    this.current = null;
    this.showPopup = () => {};
    this.closePopup = () => {};
    this.delay = []; //  因sdk未初始化而存储的场景
  }

  async init(config: any) {
    const uiconfig = config.ui;
    const sdkconfig = config.sdk;
    this.registerUI(uiconfig.show, uiconfig.close);
    await this.sdk.init(sdkconfig);
    this.checkDelay();
  }

  checkDelay() {
    if (this.delay.length) {
      this.delay.forEach((scene) => this.trigger(scene));
      this.delay.length = 0;
    }
  }

  registerUI(show: Function, close: Function) {
    if (show) this.showPopup = show;
    if (close) this.closePopup = close;
  }

  processQuene() {
    if (this.start >= this.max) return;
    const quene = this.quene.shift();
    if (!quene) return;
    this.start++;
    this.current = quene;
    this.show(quene);
  }

  async next() {
    console.log("trigger next");
    this.current = null;
    await new Promise((r) => setTimeout(r, 300));
    this.start--;
    this.processQuene();
  }

  getCurrent() {
    return this.current;
  }

  async trigger(scene: any) {
    try {
      const popups = await this.sdk.trigger(scene);
      if (popups) this.quene = popups;
      this.processQuene();
    } catch (e) {
      this.delay.push(scene);
    }
  }

  show(quene: any) {
    this.showPopup(quene);
    this.sdk.show(quene);
  }

  close(manual: any) {
    if (!manual) {
      // 如果不是用户手动关闭，则手动关闭
      this.closePopup();
    }
    if (this.current) {
      this.sdk.close(this.current);
      this.next();
    }
  }
}
