"use client";

import { useState } from "react";
import {
  Ticket,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Hash,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type { CardKind, CardRedeemRes, CardCodesRes, CardsAvailable } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import { isAdmin, formatMs } from "@/lib/format";
import { cn } from "@/lib/cn";
import "./cards.css";

export default function CardsPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const toast = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CardRedeemRes | null>(null);
  const [userKey, setUserKey] = useState(0);

  const redeem = async () => {
    const c = code.trim().toUpperCase();
    if (!c) {
      toast.error("请填写卡密");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<CardRedeemRes>("/cards/redeem", { code: c });
      setResult(res);
      setCode("");
      setUserKey((k) => k + 1);
      toast.success(`兑换成功 · 延长 ${res.days} 天`);
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "兑换失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        icon={<Ticket size={22} />}
        title="卡密中心"
        subtitle={admin ? "兑换明文卡密 / 或粘贴卡密兑换会员时长" : "粘贴卡密兑换会员时长"}
      />

      <Card className="mb-6">
        <CardBody>
          <h3 className="cards-section-title">
            <Ticket size={16} /> 兑换卡密
          </h3>
          <p className="cards-section-sub">把你拿到的明文卡密粘贴到下面，后端验证后自动延长会员时长。</p>

          <div className="cards-redeem-form">
            <Input
              label="卡密"
              placeholder="例如 AAAA-BBBB-CCCC-DDDD"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              hint="卡密不区分大小写，自动转大写比对"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}
            />
            <Button
              size="lg"
              loading={busy}
              onClick={() => void redeem()}
              disabled={!code.trim()}
              className="cards-redeem-btn"
            >
              <Ticket size={16} /> 兑换
            </Button>
          </div>

          {result && (
            <div className="cards-redeem-result animate-pop" key={userKey}>
              <span className="cards-redeem-check" aria-hidden="true">
                <Check size={20} />
              </span>
              <div className="cards-redeem-body">
                <p className="cards-redeem-label">
                  兑换成功 · 延长 {result.days} 天（{result.kind}）
                </p>
                <p className="cards-redeem-until">
                  会员到期 {formatMs(result.memberUntil)}
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {admin && <CodesSection />}
    </>
  );
}

function CodesSection() {
  const { user } = useAuth();
  const [kind, setKind] = useState<CardKind>("month");
  const { data: stock, loading: stockLoading, reload: reloadStock } = useFetch<CardsAvailable>("/cards/available");
  const { data, loading, error, reload } = useFetch<CardCodesRes>(
    `/cards/codes?kind=${kind}`,
    [kind]
  );
  const toast = useToast();

  const refill = async () => {
    try {
      await api.post<{ ok: true }>("/cards/refill");
      toast.success("已触发补生成");
      void reload();
      void reloadStock();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "补生成失败");
    }
  };

  const stockForKind = stock?.[kind] ?? 0;

  return (
    <Card>
      <CardBody>
        <div className="cards-codes-head">
          <h3 className="cards-section-title">
            <Eye size={16} /> 明文卡密（内部成员以上）
          </h3>
          {isAdmin(user?.role) && (
            <Button variant="outline" size="sm" onClick={() => void refill()}>
              <RefreshCw size={14} /> 补生成
            </Button>
          )}
        </div>
        <p className="cards-section-sub">
          {stockLoading ? "加载余量..." : `当前 ${kind} 库存 ${stockForKind} 张`}
        </p>

        <div className="tab-bar cards-codes-tabs">
          {(["month", "quarter", "year"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className="tab"
              data-active={kind === k}
              onClick={() => setKind(k)}
            >
              {k === "month" ? "月卡" : k === "quarter" ? "季卡" : "年卡"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="cards-codes-loading"><Spinner /></div>
        ) : error ? (
          <p className="cards-codes-error">{error}</p>
        ) : data && data.codes.length > 0 ? (
          <ul className="cards-codes-list stagger">
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
