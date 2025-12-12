import { Fetcher } from "./Fetcher";
import { Scheduler } from "./Scheduler";
import { Preloader } from "./Preloader";
import { Tracker } from "./Tracker";
import { Manager } from "./UIManager";
import { Strategy } from "./Strategy";
// 负责暴露sdk方法给外部使用
class PopupSdk {
  config = null;
  isInited = false;
  popupList = [];

  delayTrigger = []; // scene场景

  async init(config) {
    this.config = config;
    this.popupList = await Fetcher.getPopupList(config.api);
    if (!Array.isArray(this.popupList)) return;
    if (config.preload) {
      this.popupList.forEach((p) => Preloader.loadPopup(p));
    }
    this.isInited = true;
    // 初始化完成检查事件
    this.checkDelay();
  }

  checkDelay() {
    if (this.delayTrigger.length) {
      this.delayTrigger.forEach((scene) => this.trigger(scene));
      this.delayTrigger.length = 0;
    }
  }

  trigger(scene) {
    if (!this.isInited) {
      // 未初始化则保留事件
      this.delayTrigger.push(scene);
    } else {
      const popups = Scheduler.getPopup(this.popupList, scene);
      console.log(111, "trigger showpopups", popups);
      if (!popups?.length) return null;
      popups.forEach((popup) => Manager.pushQuene(popup));
    }
  }

  show(popup) {
    Strategy.updateStrategy(popup);
    Tracker.report("expo", popup, this.config.report);
  }

  click(popup) {
    Tracker.report("click", popup, this.config.report);
  }

  close(popup) {
    Manager.next();
    Tracker.report("close", popup, this.config.report);
  }
}

const sdk = new PopupSdk();
export default sdk;
