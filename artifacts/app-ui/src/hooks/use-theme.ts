import { useEffect, useState } from "react";

export type Theme = "dark" | "light" | "auto";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "dark"
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // React to system preference changes when in "auto" mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "auto") applyTheme("auto");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
  };

  return { theme, setTheme };
}

// Call once at app startup (before React hydrates)
export function initTheme() {
  const saved = (localStorage.getItem("theme") as Theme) || "dark";
  applyTheme(saved);
}
