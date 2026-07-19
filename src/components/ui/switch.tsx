"use client";

import { cn } from "@/lib/cn";
import "./ui.css";

interface SwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
  className?: string;
}

export function Switch({ checked, disabled, onChange, ariaLabel, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-on={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("switch", className)}
    />
  );
}
