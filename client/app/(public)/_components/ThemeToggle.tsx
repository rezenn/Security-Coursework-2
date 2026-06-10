"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem("theme") as Theme | null)
        : null;
    const initial: Theme = stored ?? "system";
    setTheme(initial);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (t: Theme) => {
      if (t === "system") {
        const prefersDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-theme", prefersDark ? "dark" : "light");
      } else {
        root.setAttribute("data-theme", t);
      }
    };

    apply(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const cycle = () => {
    setTheme((prev) =>
      prev === "system" ? "dark" : prev === "dark" ? "light" : "system",
    );
  };

  const label =
    theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title={`Theme: ${label}`}
      onClick={cycle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 dark:border-white/15 hover:bg-foreground/5 transition-colors"
    >
      {theme === "dark" ? (
        // Moon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
        </svg>
      ) : theme === "light" ? (
        // Sun
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .414.336.75.75.75Zm0-19.5a.75.75 0 0 0 .75-.75V.75a.75.75 0 0 0-1.5 0v1.5c0 .414.336.75.75.75Zm9 9a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .414.336.75.75.75ZM3.75 12a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .414.336.75.75.75Zm13.03 7.22a.75.75 0 0 0 1.06 0l1.06-1.06a.75.75 0 0 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 0 1.06Zm-12.56-12.56a.75.75 0 0 0 1.06 0l1.06-1.06A.75.75 0 1 0 5.28 3.54L4.22 4.6a.75.75 0 0 0 0 1.06Zm12.56-1.06a.75.75 0 0 0 0 1.06l1.06 1.06a.75.75 0 1 0 1.06-1.06l-1.06-1.06a.75.75 0 0 0-1.06 0ZM4.22 18.72a.75.75 0 0 0 1.06 0l1.06-1.06a.75.75 0 1 0-1.06-1.06L4.22 17.66a.75.75 0 0 0 0 1.06Z" />
        </svg>
      ) : (
        // Monitor (system)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M4 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6v2H7.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5H14v-2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4Zm0 1.5h16a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5Z" />
        </svg>
      )}
    </button>
  );
}
