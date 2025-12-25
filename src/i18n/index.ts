import { createI18n } from "vue-i18n";
// import messages from "@/locales/index";
import messagesMap from "virtual:i18n-dynamic";
import type { I18nKey } from "virtual:i18n-keys";

export const i18n = createI18n({
  locale: "zh-CN",
  fallbackLocale: "en",
  messages: {},
});

export async function loadLocale(locale: string) {
  if (!messagesMap[locale]) return;
  const msgModule = await messagesMap[locale]();
  i18n.global.setLocaleMessage(locale, msgModule.default);
  // i18n.global.locale = locale;
}

function greet(key: I18nKey) {
  console.log(i18n.global.t(key));
}

greet("hello"); // ✅

await loadLocale("zh");
