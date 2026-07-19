import type { Role } from "@/lib/types";

export function roleLabel(role: Role): string {
  switch (role) {
    case "admin":
      return "管理员";
    case "internal":
      return "内部成员";
    case "member":
      return "会员";
    default:
      return "普通用户";
  }
}

export function roleOrder(role: Role): number {
  return { normal: 0, member: 1, internal: 2, admin: 3 }[role];
}

export function hasRole(role: Role | undefined, need: Role): boolean {
  if (!role) return false;
  return roleOrder(role) >= roleOrder(need);
}

export function isStaff(role: Role | undefined): boolean {
  return hasRole(role, "internal");
}

export function isAdmin(role: Role | undefined): boolean {
  return role === "admin";
}

export function formatMs(ms: number | null | undefined): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(ms: number | null | undefined): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function remainingDays(ms: number | null | undefined): number | null {
  if (!ms) return null;
  const diff = ms - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function formatRelative(ms: number | null | undefined): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) return "刚刚";
  if (abs < hour) return `${Math.floor(abs / minute)} 分钟前`;
  if (abs < day) return `${Math.floor(abs / hour)} 小时前`;
  if (abs < 30 * day) return `${Math.floor(abs / day)} 天前`;
  return formatDate(ms);
}
