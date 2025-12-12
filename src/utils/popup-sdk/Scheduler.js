import { Preloader } from "./Preloader";
import { Strategy } from "./Strategy";

export const Scheduler = {
  getPopup(popups, scene) {
    if (!popups.length) return;

    const filters = popups.filter((popup) => Strategy.checkRules(popup, scene));
    if (!filters.length) return;
    // 从大到小排列，一个一个push，然后shift
    filters.sort((a, b) => b.priority - a.priority);
    return filters;
    // const popup = filters[0];
    // Preloader.loadPopup(popup);
    // return popup;
  },
};
