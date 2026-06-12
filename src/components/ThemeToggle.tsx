"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const options: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * Three-state theme picker. "System" removes the override so the
 * prefers-color-scheme media query applies; "Light"/"Dark" persist to
 * localStorage and are re-applied before first paint by the inline
 * script in layout.tsx.
 */
export default function ThemeToggle() {
  // null until mounted: the stored preference is only knowable on the
  // client, so no option is marked pressed during SSR/hydration.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setTheme(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    if (next === "system") {
      localStorage.removeItem("theme");
      delete document.documentElement.dataset.theme;
    } else {
      localStorage.setItem("theme", next);
      document.documentElement.dataset.theme = next;
    }
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === null ? undefined : theme === option.value}
          onClick={() => apply(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
