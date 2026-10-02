import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bot,
  Megaphone,
  MessageSquare,
  Shield,
  Share2,
  Info,
  ShieldCheck,
} from "lucide-react";
import type { Role } from "@/lib/types";
import { hasRole } from "@/lib/format";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  need?: Role;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "仪表盘",
    icon: LayoutDashboard,
    description: "账户状态概览",
  },
  {
    href: "/bots",
    label: "机器人",
    icon: Bot,
    description: "在线状态与 QQ 号",
  },
  {
    href: "/connect",
    label: "Connect",
    icon: Share2,
    need: "internal",
    description: "托管自己的代挂机器人",
  },
  {
    href: "/announcements",
    label: "公告",
    icon: Megaphone,
    description: "查看最新公告",
  },
  {
    href: "/feedback",
    label: "反馈",
    icon: MessageSquare,
    description: "提交与跟踪反馈",
  },
  {
    href: "/announcements/manage",
    label: "公告管理",
    icon: Megaphone,
    need: "admin",
    description: "发布与管理公告",
  },
  {
    href: "/admin/connect",
    label: "Connect 管理",
    icon: ShieldCheck,
    need: "admin",
    description: "管理所有代挂机器人",
  },
  {
    href: "/admin",
    label: "管理",
    icon: Shield,
    need: "admin",
    description: "内部成员与管理员",
  },
  {
    href: "/about",
    label: "关于",
    icon: Info,
    description: "关于 Leeklet",
  },
];

export function visibleNav(role: Role | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.need || hasRole(role, item.need));
}

/** 移动端底部固定展示的5项（最常用） */
export const MOBILE_PRIMARY = ["/", "/bots", "/feedback", "/announcements", "/about"];
