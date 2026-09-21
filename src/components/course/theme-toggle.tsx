"use client";

import { useTheme } from "@/components/course/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-white/[0.08] bg-white/[0.03] transition"
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      <span
        className="absolute left-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-crow-violet/20 text-crow-glow"
        style={{ transform: theme === "dark" ? "translate(-50%, -50%)" : "translate(calc(100% - 50%), -50%)" }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
      <span
        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-crow-muted"
        style={{ transform: theme === "dark" ? "translate(calc(100% - 50%), -50%)" : "translate(-50%, -50%)" }}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
      <div
        className="absolute left-0.5 top-0.5 h-7 w-7 rounded-full bg-white/[0.06] transition-transform duration-200"
        style={{
          transform: theme === "dark" ? "translateX(0)" : "translateX(100%)",
        }}
      />
    </button>
  );
}