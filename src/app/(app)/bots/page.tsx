"use client";

import { useEffect, useState } from "react";
import { Bot, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useFetch } from "@/lib/use-fetch";
import type { BotStatus, BotsRes } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shell/page-header";
import { formatMs, formatRelative } from "@/lib/format";
import "./bots.css";

const REFRESH_MS = 30_000;

export default function BotsPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch<BotsRes>("/bots");
  const [refreshing, setRefreshing] = useState(false);

  // 每 30 秒自动刷新在线状态
  useEffect(() => {
    const timer = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [reload]);

  if (!user) return null;

  const manualRefresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  const bots = data?.bots ?? [];
  const online = data?.online ?? 0;
  const total = data?.total ?? 0;
  const offline = total - online;

  return (
    <>
      <PageHeader
        icon={<Bot size={22} />}
        title="机器人状态"
        subtitle="已接入的 bot 与在线状态"
        actions={
          <Button variant="soft" size="sm" onClick={() => void manualRefresh()} disabled={loading || refreshing}>
            <RefreshCw size={14} className={loading || refreshing ? "spin" : undefined} />
            刷新
          </Button>
        }
      />

      {/* 概览统计 */}
      <div className="bots-stats stagger">
        <StatCard label="全部机器人" value={total} hint="已接入的 bot 总数" />
        <StatCard label="在线" value={online} tone="online" hint="当前连接正常" />
        <StatCard label="离线" value={offline} tone="offline" hint="未连接或已断开" />
      </div>

      <h3 className="bots-section-title">机器人列表</h3>

      {error ? (
        <Empty
          icon={WifiOff}
          title="无法加载机器人状态"
          hint={error}
          action={
            <Button variant="soft" size="sm" className="mt-3" onClick={() => void manualRefresh()}>
              重试
            </Button>
          }
        />
      ) : loading && !data ? (
        <Card soft className="bots-loading">
          <Spinner />
        </Card>
      ) : bots.length === 0 ? (
        <Empty icon={Bot} title="暂无机器人" hint="bot 连接后将展示在这里" />
      ) : (
        <div className="bots-grid stagger">
          {bots.map((bot) => (
            <BotCard key={`${bot.adapter}:${bot.botId}`} bot={bot} />
          ))}
        </div>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone?: "online" | "offline";
  hint: string;
}) {
  return (
    <Card className="bots-stat-card">
      <CardBody>
        <div className="bots-stat-top">{label}</div>
        <div className={`bots-stat-num${tone ? ` is-${tone}` : ""}`}>
          {value}
          <span className="bots-stat-unit">个</span>
        </div>
        <p className="text-xs" style={{ color: "var(--fg-muted)", margin: 0 }}>
          {hint}
        </p>
      </CardBody>
    </Card>
  );
}

function BotCard({ bot }: { bot: BotStatus }) {
  return (
    <Card className="bot-card">
      <CardBody>
        <div className="bot-card-head">
          <BotAvatar qq={bot.qq} name={bot.nickname ?? bot.botId} />
          <div className="bot-card-id">
            <p className="bot-name">{bot.nickname || bot.botId}</p>
            <p className="bot-qq">QQ {bot.qq || bot.botId}</p>
          </div>
          <span className={`bot-status ${bot.online ? "is-online" : "is-offline"}`}>
            {bot.online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {bot.online ? "在线" : "离线"}
          </span>
        </div>
        <div className="bot-card-meta">
          <Badge variant="normal" className="bot-adapter">
            {bot.adapter}
          </Badge>
          {bot.connect && (
            <Badge variant="internal" className="bot-community">
              社区
            </Badge>
          )}
          <span className="bot-connected" title={formatMs(bot.connectedAt)}>
            {bot.online
              ? `连接于 ${formatRelative(bot.connectedAt)}`
              : "未连接"}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

function BotAvatar({ qq, name }: { qq: number; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !qq) {
    return (
      <span className="bot-avatar-fallback" aria-label={name}>
        <Bot size={26} strokeWidth={1.6} />
      </span>
    );
  }
  return (
    <img
      className="bot-avatar"
      src={`https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=160`}
      alt={name}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
