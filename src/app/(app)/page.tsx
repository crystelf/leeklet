"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Info,
  ArrowRight,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shell/page-header";
import { isAdmin, roleLabel, remainingDays, formatMs } from "@/lib/format";
import "./dashboard.css";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const admin = isAdmin(user.role);
  const isInternalOrAdmin = user.role === "internal" || user.role === "admin";
  const days = remainingDays(user.memberUntil);
  const memberActive = isInternalOrAdmin || user.role === "member";
  const memberPercent = isInternalOrAdmin
    ? 100
    : memberActive && days !== null
      ? Math.min(100, Math.max(2, (days / 365) * 100))
      : 0;

  return (
    <>
      <PageHeader
        icon={<LayoutDashboard size={22} />}
        title="仪表盘"
        subtitle="账户状态概览"
      />

      {/* 欢迎卡片 */}
      <Card className="overflow-hidden mb-6">
        <div className="dash-welcome">
          <img
            className="dash-welcome-avatar"
            src={`https://q.qlogo.cn/headimg_dl?dst_uin=${user.qq}&spec=160`}
            alt={user.nickname ?? `QQ ${user.qq}`}
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="dash-welcome-body">
            <p className="dash-welcome-hi">
              <Sparkles size={14} /> 你好
            </p>
            <h2 className="dash-welcome-name">
              {user.nickname || `QQ ${user.qq}`}
              <RoleBadge role={user.role} className="ml-2" />
            </h2>
            <p className="dash-welcome-sub">
              {user.nickname ? `QQ ${user.qq} · ` : ""}
              {user.email ? `邮箱 ${user.email} · ` : ""}
              {roleLabel(user.role)}
              {user.registered ? " · 已设置密码" : " · 仅密钥登录"}
            </p>
          </div>
          <div className="dash-welcome-member">
            <div className="dash-member-head">
              <CalendarClock size={16} />
              <span>会员状态</span>
            </div>
            {isInternalOrAdmin ? (
              <>
                <div className="dash-member-days">内部会员</div>
                <div className="dash-progress">
                  <span style={{ width: "100%" }} />
                </div>
                <p className="dash-member-until">永久有效，畅通无阻</p>
              </>
            ) : memberActive && days !== null && days > 0 ? (
              <>
                <div className="dash-member-days">{`${days} 天`}</div>
                <div className="dash-progress">
                  <span style={{ width: `${memberPercent}%` }} />
                </div>
                <p className="dash-member-until">
                  到期 {formatMs(user.memberUntil)}
                </p>
              </>
            ) : (
              <p className="dash-member-empty">
                暂无会员<br />
                如需开通请联系管理员
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 快捷入口 */}
      <h3 className="dash-section-title">快捷入口</h3>
      <div className="dash-quick-grid stagger">
        <QuickLink href="/announcements" icon={<Megaphone size={20} />} title="查看公告" hint="了解最新动态与通知" />
        <QuickLink href="/feedback" icon={<MessageSquare size={20} />} title="提交反馈" hint="报告问题或建议" />
        {admin && (
          <QuickLink href="/announcements/manage" icon={<Megaphone size={20} />} title="公告管理" hint="发布与管理公告" />
        )}
        <QuickLink href="/about" icon={<Info size={20} />} title="关于 Leeklet" hint="了解 Leeklet" />
      </div>
    </>
  );
}

function QuickLink({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link href={href} className="dash-quick">
      <span className="dash-quick-icon">{icon}</span>
      <span className="dash-quick-text">
        <span className="dash-quick-title">{title}</span>
        <span className="dash-quick-hint">{hint}</span>
      </span>
      <ArrowRight size={16} className="dash-quick-arrow" />
    </Link>
  );
}
