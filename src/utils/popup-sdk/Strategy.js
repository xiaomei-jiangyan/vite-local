// 负责挑选出一个需要显示的popup
import { isIos, isAndroid } from "@/utils/index";
import { Storage } from "./Storage";

export const Strategy = {
  delayPopup: [],
  checkRules(popup, scene) {
    if (!popup.content || !popup.enabled) return false;
    if (popup.displayRules) {
      const rules = popup.displayRules;
      if (rules.triggerScenes.indexOf(scene) === -1) return false;
      if (
        !rules.platform.some((p) => {
          if (p === "ios") return isIos();
          if (p === "android") return isAndroid();
        })
      )
        return false;
      const now = Date.now();
      if (rules.startTime && rules.endTime && (now < rules.startTime || now > rules.endTime))
        return false;
      const last = Storage.get(popup.popupId) ?? { times: 0 };
      if (typeof rules.maxShowTimes !== "undefined" && last.times >= rules.maxShowTimes)
        return false;
      // 如果还不满足距离上次显示间隔，则不显示
      if (
        last.lastShow &&
        rules.showIntervalHours &&
        now - last.lastShow <= rules.showIntervalHours * 60 * 60 * 1000
      )
        return false;
      if (rules.needLogin && !localStorage.getItem("token")) {
        this.delayPopup.push(delayPopup);
        return false;
      }
      return true;
    } else {
      return true;
    }
  },
  updateStrategy(popup) {
    const last = Storage.get(popup.popupId) ?? { times: 0 };
    Storage.set(popup.popupId, {
      times: last.times + 1,
      lastShow: Date.now(),
    });
  },
  getDelayPopup() {
    // 根据登录情况变化
    return this.delayPopup;
  },
};
