import { Fetcher } from "./Fetcher";
import { Scheduler } from "./Scheduler";
import { Preloader } from "./Preloader";
import { Tracker } from "./Tracker";
import { Strategy } from "./Strategy";
// 负责暴露sdk方法给外部使用
class PopupSdk {
  config = null;
  isInited = false;
  popupList = [];

  delayTrigger = []; // scene场景 存scene[]

  async init(config) {
    this.config = config;
    this.popupList = await Fetcher.getPopupList(config.api);
    if (!Array.isArray(this.popupList)) return;
    if (config.preload) {
      this.popupList.forEach((p) => Preloader.loadPopup(p));
    }
    this.isInited = true;
  }

  trigger(scene) {
    if (!this.isInited) {
      // 未初始化则保留事件
      throw new Error("sdk is not inited");
    } else {
      const popups = Scheduler.getPopup(this.popupList, scene);
      if (!popups?.length) return null;
      return popups;
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
    Tracker.report("close", popup, this.config.report);
  }
}

const sdk = new PopupSdk();

export default sdk;
