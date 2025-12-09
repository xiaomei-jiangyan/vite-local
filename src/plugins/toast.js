import { useToast } from "@/components/Toast/index.js";

export default {
  install(app) {
    // create toast manager
    const toast = useToast();
    // expose on globalProperties for Options API / templates: this.$toast
    app.config.globalProperties.$toast = toast;
    // provide for Composition API injection: const toast = inject('toast')
    if (app.provide) app.provide("toast", toast);
  },
};
