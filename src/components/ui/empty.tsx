import type { LucideIcon } from "lucide-react";
import "./ui.css";

export function Empty({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span
        className="grid place-items-center"
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--accent-soft)",
          color: "var(--accent)",
        }}
      >
        <Icon size={26} strokeWidth={1.6} />
      </span>
      <p className="font-semibold" style={{ color: "var(--fg-soft)" }}>
        {title}
      </p>
      {hint && <p className="text-sm max-w-xs">{hint}</p>}
      {action}
    </div>
  );
}
