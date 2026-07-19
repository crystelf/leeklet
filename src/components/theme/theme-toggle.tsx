"use client";

import { useTheme } from "./theme-provider";
import "./theme-toggle.css";

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315] as const;
interface StarPos {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  w: string;
  d: string;
}

const STARS: StarPos[] = [
  { top: "22px", left: "23px", w: "8px", d: "0.18s" },
  { top: "29px", right: "20px", w: "6px", d: "0.23s" },
  { right: "25px", bottom: "24px", w: "9px", d: "0.28s" },
  { bottom: "25px", left: "21px", w: "5px", d: "0.33s" },
];

export function ThemeToggle({ size = 56 }: { size?: number }) {
  const { resolved, toggle } = useTheme();
  const checked = resolved === "dark";

  return (
    <button
      type="button"
      aria-label={checked ? "切换到白天模式" : "切换到夜晚模式"}
      aria-pressed={checked}
      onClick={toggle}
      className="theme-toggle-btn"
      style={{ ["--size" as string]: `${size}px` }}
      data-checked={checked}
    >
      <span className="theme-toggle-scene" aria-hidden="true">
        <span className="theme-toggle-rays">
          {RAYS.map((deg, i) => (
            <span
              key={deg}
              className="theme-toggle-ray"
              style={{
                transform: `rotate(${deg}deg)`,
                animationDelay: `${i * 0.025}s`,
              }}
            />
          ))}
        </span>
        <span className="theme-toggle-orb">
          <span className="theme-toggle-crater" style={{ animationDelay: "0s" }} />
          <span className="theme-toggle-crater" style={{ animationDelay: "0.04s" }} />
          <span className="theme-toggle-crater" style={{ animationDelay: "0.08s" }} />
        </span>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="theme-toggle-star"
            style={{
              top: s.top,
              left: s.left,
              right: s.right,
              bottom: s.bottom,
              width: s.w,
              animationDelay: s.d,
            } as React.CSSProperties}
          />
        ))}
      </span>
    </button>
  );
}
