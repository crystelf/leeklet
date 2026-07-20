import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Ticket,
  Users,
  SlidersHorizontal,
  MailCheck,
  Megaphone,
  MessageSquare,
  Shield,
  Receipt,
  Info,
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
    description: "账户状态与卡密概览",
  },
  {
    href: "/cards",
    label: "卡密",
    icon: Ticket,
    description: "兑换与余量",
  },
  {
    href: "/groups",
    label: "群管理",
    icon: Users,
    description: "认领与激活群会员",
  },
  {
    href: "/control",
    label: "功能控制",
    icon: SlidersHorizontal,
    description: "Bot 与 AI 开关",
  },
  {
    href: "/invites",
    label: "邀请",
    icon: MailCheck,
    description: "拉群申请与审批",
  },
  {
    href: "/feedback",
    label: "反馈",
    icon: MessageSquare,
    description: "提交与跟踪反馈",
  },
  {
    href: "/subscriptions",
    label: "订阅",
    icon: Receipt,
    need: "internal",
    description: "会员订阅与兑换记录",
  },
  {
    href: "/announcements/manage",
    label: "公告管理",
    icon: Megaphone,
    need: "internal",
    description: "发布与管理公告",
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
export const MOBILE_PRIMARY = ["/groups", "/control", "/invites", "/feedback", "/about"];
