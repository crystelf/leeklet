import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";
import { roleLabel } from "@/lib/format";
import "./ui.css";

export function Badge({
  variant = "normal",
  children,
  className,
}: {
  variant?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("badge", `badge-${variant}`, className)}>{children}</span>
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <Badge variant={role} className={className}>
      {roleLabel(role)}
    </Badge>
  );
}
