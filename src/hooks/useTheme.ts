import { onMounted, ref, readonly } from "vue";

export type ThemeMode = "dark" | "light";

export function useTheme() {
  const theme = ref<ThemeMode>();

  const getTheme = (): ThemeMode => {
    if (theme.value === "dark" || theme.value === "light") return theme.value;
    try {
      const saved = localStorage.getItem("darkMode");
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {}
    const matches =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return matches ? "dark" : "light";
  };

  const setTheme = (mode?: ThemeMode) => {
    theme.value = mode || getTheme();
    document.documentElement.setAttribute("data-theme", theme.value);
    try {
      localStorage.setItem("theme", theme.value);
    } catch (e) {}
    const meta = document.querySelector("meta[name=theme-color]");
    if (meta) meta.setAttribute("content", theme.value === "dark" ? "#0b0b0d" : "#ffffff");
  };

  onMounted(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: any) => {
      const manual = localStorage.getItem("theme");
      if (!manual) setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener && mq.addEventListener("change", handler);
    return () => mq.removeEventListener && mq.removeEventListener("change", handler);
  });

  // Expose a readonly ref to consumers so they can react to theme changes
  // but cannot mutate it directly (use `setTheme` to change the theme).
  return [readonly(theme), setTheme];
}
