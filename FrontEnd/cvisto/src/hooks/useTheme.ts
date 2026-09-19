import { useState, useEffect, useCallback } from "react";

export type ThemePreference = "dark" | "light" | "system";

const STORAGE_KEY = "cvisto_theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return saved === "light" || saved === "dark" || saved === "system"
      ? saved
      : "dark";
  });

  const aplicarClases = useCallback((pref: ThemePreference) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    let esOscuro = true;
    if (pref === "dark") {
      esOscuro = true;
    } else if (pref === "light") {
      esOscuro = false;
    } else if (pref === "system") {
      esOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    if (esOscuro) {
      root.classList.remove("light");
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
    }
  }, []);

  const setTheme = useCallback(
    (nuevoTema: ThemePreference) => {
      setThemeState(nuevoTema);
      localStorage.setItem(STORAGE_KEY, nuevoTema);
      aplicarClases(nuevoTema);
    },
    [aplicarClases],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  useEffect(() => {
    aplicarClases(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => aplicarClases("system");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme, aplicarClases]);

  const resolvedTheme: "dark" | "light" =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
