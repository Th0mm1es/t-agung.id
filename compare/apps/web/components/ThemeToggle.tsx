"use client";

import React, { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Check initial theme from html attribute or localStorage
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light" ||
      localStorage.getItem("theme") === "light";
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const isCurrentLight =
      document.documentElement.getAttribute("data-theme") === "light" ||
      theme === "light";
    const nextTheme = isCurrentLight ? "dark" : "light";
    setTheme(nextTheme);

    try {
      localStorage.setItem("theme", nextTheme);
    } catch {}

    if (nextTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const isLight = theme === "light";

  return (
    <div className="flex items-center gap-1.5" title={isLight ? "Ganti ke Mode Gelap (Dark)" : "Ganti ke Mode Terang (Light)"}>
      <button
        id="theme-toggle"
        type="button"
        onClick={toggleTheme}
        className="theme-toggle-btn group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          cursor: "pointer",
        }}
        aria-label={isLight ? "Ganti ke mode gelap" : "Ganti ke mode terang"}
      >
        <span
          className={`text-[11px] font-mono select-none transition-colors ${
            !isLight
              ? "font-bold text-[var(--accent)]"
              : "text-[var(--muted)] opacity-60 group-hover:opacity-100"
          }`}
        >
          🌙 Dark
        </span>

        {/* Pill Track */}
        <span
          className="relative inline-flex items-center w-8 h-4 rounded-full transition-colors p-0.5"
          style={{
            background: "var(--surface-3)",
            border: "1px solid var(--border-strong)",
          }}
        >
          {/* Sliding Thumb */}
          <span
            className="w-3 h-3 rounded-full transition-transform duration-200 shadow-sm"
            style={{
              background: "var(--accent)",
              transform: isLight ? "translateX(14px)" : "translateX(0px)",
            }}
          />
        </span>

        <span
          className={`text-[11px] font-mono select-none transition-colors ${
            isLight
              ? "font-bold text-[var(--accent)]"
              : "text-[var(--muted)] opacity-60 group-hover:opacity-100"
          }`}
        >
          ☀️ Light
        </span>
      </button>
    </div>
  );
}
