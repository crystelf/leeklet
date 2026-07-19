"use client";

import { useState } from "react";
import {
  Ticket,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Sparkles,
  Hash,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type { CardKind, CardsAvailable, CardPurchaseRes, CardCodesRes } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shell/page-header";
import { LeekLogo } from "@/components/shell/leek-logo";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import { isAdmin, isStaff, formatMs, remainingDays } from "@/lib/format";
import { cn } from "@/lib/cn";
import "./cards.css";
import "./cards.css";

const KIND_META: { kind: CardKind; label: string; days: number; hint: string }[] = [
  { kind: "month", label: "月卡", days: 30, hint: "延长 30 天会员" },
  { kind: "quarter", label: "季卡", days: 90, hint: "延长 90 天会员" },
  { kind: "year", label: "年卡", days: 365, hint: "延长 365 天会员" },
];

export default function CardsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: stock, loading, reload } = useFetch<CardsAvailable>("/cards/available");

  const [selected, setSelected] = useState<CardKind>("month");
  const [purchasing, setPurchasing] = useState(false);
  const [result, setResult] = useState<CardPurchaseRes | null>(null);
  const [dropKey, setDropKey] = useState(0);

  const staff = isStaff(user?.role);

  const purchase = async () => {
    setPurchasing(true);
    setResult(null);
    try {
      const res = await api.post<CardPurchaseRes>("/cards/purchase", { kind: selected });
      setResult(res);
      setDropKey((k) => k + 1);
      toast.success(res.consumed ? `兑换成功，会员延长 ${res.days} 天` : "已取出一张卡密");
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "兑换失败");
    } finally {
      setPurchasing(false);
    }
  };

  const refill = async () => {
    try {
      await api.post<{ ok: true }>("/cards/refill");
      toast.success("已触发补生成");
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "补生成失败");
    }
  };

  return (
    <>
      <PageHeader
        icon={<Ticket size={22} />}
        title="卡密中心"
        subtitle={
          staff
            ? "内部成员可查看明文，管理员可补生成"
            : "兑换卡密延长会员时长"
        }
        actions={
          isAdmin(user?.role) ? (
            <Button variant="outline" size="sm" onClick={() => void refill()}>
              <RefreshCw size={14} /> 补生成
            </Button>
          ) : undefined
        }
      />

      {/* 余量 */}
      <div className="cards-stock-grid">
        {loading ? (
          <Card soft className="cards-stock-loading">
            <Spinner />
          </Card>
        ) : stock ? (
          KIND_META.map((m) => (
            <Card key={m.kind} className="cards-stock-card">
              <CardBody>
                <div className="cards-stock-top">
                  <Ticket size={16} />
                  <span>{m.label}</span>
                </div>
                <div className="cards-stock-num">
                  {stock[m.kind] ?? 0}
                  <span>张</span>
                </div>
                <p className="cards-stock-days">{m.days} 天</p>
              </CardBody>
            </Card>
          ))
        ) : (
          <Card soft className="cards-stock-loading">
            <span className="text-sm" style={{ color: "var(--fg-muted)" }}>无法加载</span>
          </Card>
        )}
      </div>

      {/* 兑换 */}
      <Card className="mt-6">
        <CardBody>
          <h3 className="cards-section-title">
            <Sparkles size={16} /> 兑换卡密
          </h3>
          <p className="cards-section-sub">
            {staff
              ? "内部成员/管理员兑换不消费卡密，仅取出一张明文。"
              : "选择类型后点击兑换，将消费一张卡密并延长你的会员。"}
          </p>

          <div className="cards-pick-grid">
            {KIND_META.map((m) => {
              const active = selected === m.kind;
              return (
                <button
                  key={m.kind}
                  type="button"
                  className={cn("cards-pick", active && "cards-pick-active")}
                  onClick={() => setSelected(m.kind)}
                  data-active={active}
                >
                  <span className="cards-pick-label">{m.label}</span>
                  <span className="cards-pick-days">{m.days} 天</span>
                  <span className="cards-pick-hint">{m.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="cards-purchase-row">
            <Button
              size="lg"
              loading={purchasing}
              onClick={() => void purchase()}
              disabled={(stock?.[selected] ?? 0) <= 0}
            >
              <Ticket size={16} /> 兑换 {KIND_META.find((m) => m.kind === selected)?.label}
            </Button>
            {!staff && user?.memberUntil && (
              <span className="cards-member-info">
                当前会员剩余 {remainingDays(user.memberUntil) ?? 0} 天
              </span>
            )}
          </div>

          {/* 兑换结果 + 大葱 drop 动画 */}
          {result && (
            <div className="cards-result animate-pop" key={dropKey}>
              <span className="cards-leek-drop" aria-hidden="true">
                <LeekLogo size={56} />
              </span>
              <div className="cards-result-body">
                <p className="cards-result-label">
                  {result.consumed ? `兑换成功 · 会员延长 ${result.days} 天` : "已取出卡密"}
                </p>
                <code className="cards-result-code">{result.code}</code>
                <div className="cards-result-actions">
                  <CopyButton text={result.code} />
                  {result.memberUntil && (
                    <span className="cards-result-until">
                      会员到期 {formatMs(result.memberUntil)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 明文列表（internal+） */}
      {staff && <CodesSection />}
    </>
  );
}

function CodesSection() {
  const [kind, setKind] = useState<CardKind>("month");
  const { data, loading, error } = useFetch<CardCodesRes>(
    `/cards/codes?kind=${kind}`,
    [kind]
  );

  return (
    <Card className="mt-6">
      <CardBody>
        <h3 className="cards-section-title">
          <Eye size={16} /> 卡密明文
        </h3>
        <p className="cards-section-sub">切换类型查看未售出的卡密明文。</p>

        <div className="tab-bar cards-codes-tabs">
          {KIND_META.map((m) => (
            <button
              key={m.kind}
              type="button"
              className="tab"
              data-active={kind === m.kind}
              onClick={() => setKind(m.kind)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="cards-codes-loading"><Spinner /></div>
        ) : error ? (
          <p className="cards-codes-error">{error}</p>
        ) : data && data.codes.length > 0 ? (
          <ul className="cards-codes-list">
            {data.codes.map((c) => (
              <li key={c} className="cards-code-row">
                <Hash size={14} className="cards-code-hash" />
                <code className="cards-code-text">{c}</code>
                <CopyButton text={c} small />
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={Ticket} title="暂无库存" hint="该类型卡密已售罄，等待自动补生成" />
        )}
      </CardBody>
    </Card>
  );
}

function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      toast.success("已复制");
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error("复制失败");
    }
  };
  return (
    <Button
      variant={small ? "ghost" : "soft"}
      size={small ? "sm" : "md"}
      onClick={() => void copy()}
      className={cn(small && "cards-copy-small")}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {small ? "" : done ? "已复制" : "复制"}
    </Button>
  );
}

export type { CardKind };
