"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Ticket,
  Users,
  MessageSquare,
  ArrowRight,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type { CardsAvailable } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shell/page-header";
import { roleLabel, remainingDays, formatMs } from "@/lib/format";
import "./dashboard.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardsAvailable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get<CardsAvailable>("/cards/available")
      .then((c) => alive && setCards(c))
      .catch((e) => {
        if (e instanceof ApiRequestError) console.warn(e.body);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;

  const days = remainingDays(user.memberUntil);
  const memberActive = user.role === "member" || user.role === "internal" || user.role === "admin";
  const memberPercent = memberActive && days !== null ? Math.min(100, Math.max(2, (days / 365) * 100)) : 0;

  return (
    <>
      <PageHeader
        icon={<LayoutDashboard size={22} />}
        title="仪表盘"
        subtitle="账户状态与卡密概览"
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
            {memberActive ? (
              <>
                <div className="dash-member-days">
                  {days !== null && days > 0 ? `${days} 天` : "已过期"}
                </div>
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
                <Link href="/cards" className="dash-member-link">
                  去兑换 <ArrowRight size={12} />
                </Link>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 卡密余量 */}
      <h3 className="dash-section-title">卡密余量</h3>
      <div className="dash-cards-grid">
        {loading ? (
          <Card soft className="dash-card-loading">
            <Spinner />
          </Card>
        ) : cards ? (
          ([
            { k: "month", label: "月卡", days: 30 },
            { k: "quarter", label: "季卡", days: 90 },
            { k: "year", label: "年卡", days: 365 },
          ] as const).map((item) => (
            <Card key={item.k} className="dash-stock-card">
              <CardBody>
                <div className="dash-stock-top">
                  <Ticket size={18} />
                  <span>{item.label}</span>
                </div>
                <div className="dash-stock-num">
                  {cards[item.k as keyof CardsAvailable] ?? 0}
                  <span className="dash-stock-unit">张</span>
                </div>
                <p className="dash-stock-days">有效期 {item.days} 天</p>
                <Link href="/cards">
                  <Button variant="soft" size="sm" className="w-full mt-3">
                    去兑换
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))
        ) : (
          <Card soft className="dash-card-loading">
            <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
              无法加载余量
            </span>
          </Card>
        )}
      </div>

      {/* 快捷入口 */}
      <h3 className="dash-section-title">快捷入口</h3>
      <div className="dash-quick-grid">
        <QuickLink href="/cards" icon={<Ticket size={20} />} title="兑换卡密" hint="消费一张卡密延长会员" />
        <QuickLink href="/groups" icon={<Users size={20} />} title="认领群" hint="激活群会员状态" />
        <QuickLink href="/feedback" icon={<MessageSquare size={20} />} title="提交反馈" hint="报告问题或建议" />
        <QuickLink href="/control" icon={<LayoutDashboard size={20} />} title="功能控制" hint="管理 bot 与 AI 开关" />
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
