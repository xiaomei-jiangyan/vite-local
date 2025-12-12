export const Tracker = {
  report(type, popup, reportFn) {
    if (!reportFn) return;
    reportFn(type, {
      popupId: popup.popupId,
      timestamp: Date.now(),
    });
  },
};
