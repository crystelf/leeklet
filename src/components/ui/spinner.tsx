import { cn } from "@/lib/cn";
import "./ui.css";

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("spinner", className)} aria-hidden="true" />;
}

export function LoadingScreen({ label = "加载中" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner />
      <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{label}…</p>
    </div>
  );
}
