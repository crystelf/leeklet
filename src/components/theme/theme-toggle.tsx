"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import "./theme-toggle.css";

export function ThemeToggle({ size = 44 }: { size?: number }) {
  const { resolved, toggle } = useTheme();
  const dark = resolved === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      data-theme={resolved}
      style={{ ["--theme-toggle-size" as string]: `${size}px` }}
      aria-label={dark ? "切换到白天模式" : "切换到夜晚模式"}
      aria-pressed={dark}
      title={dark ? "切换到白天模式" : "切换到夜晚模式"}
      onClick={toggle}
    >
      <span className="theme-toggle-icon theme-toggle-sun" aria-hidden="true">
        <Sun />
      </span>
      <span className="theme-toggle-icon theme-toggle-moon" aria-hidden="true">
        <Moon />
      </span>
    </button>
  );
}
