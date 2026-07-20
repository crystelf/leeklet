"use client";

import { useState } from "react";
import { Receipt, UserPlus, CalendarClock } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type {
  SubscriptionsRedeemsRes,
  SubscriptionsMembersRes,
  SubscriptionMember,
  SetMembershipRes,
} from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import { isStaff, isAdmin, formatMs, remainingDays } from "@/lib/format";
import "./subscriptions.css";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const staff = isStaff(user?.role);
  const admin = isAdmin(user?.role);
  const [tab, setTab] = useState<"members" | "redeems">("members");

  if (!staff) {
    return (
      <>
        <PageHeader icon={<Receipt size={22} />} title="订阅管理" />
        <Card soft>
          <CardBody>
            <Empty
              icon={Receipt}
              title="仅内部成员可访问"
              hint="此页面用于查看会员订阅与卡密兑换记录。"
            />
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={<Receipt size={22} />}
        title="订阅管理"
        subtitle="会员订阅与卡密兑换记录"
      />
      <div className="tab-bar sub-tabs">
        <button className="tab" data-active={tab === "members"} onClick={() => setTab("members")}>
          会员管理
        </button>
        <button className="tab" data-active={tab === "redeems"} onClick={() => setTab("redeems")}>
          兑换记录
        </button>
      </div>

      {tab === "members" ? <MembersSection admin={admin} /> : <RedeemsSection />}
    </>
  );
}

function MembersSection({ admin }: { admin: boolean }) {
  const { data, loading, error, reload } = useFetch<SubscriptionsMembersRes>(
    "/subscriptions/members",
  );
  const [editTarget, setEditTarget] = useState<SubscriptionMember | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <>
      {admin && (
        <Card className="mb-5">
          <CardBody>
            <h3 className="sub-section-title">新增 / 设置订阅</h3>
            <p className="sub-section-sub">输入 QQ 与失效时间，给用户开通或续期会员。</p>
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <UserPlus size={14} /> 设置订阅
            </Button>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div className="sub-loading"><Spinner /></div>
      ) : error ? (
        <Card soft><CardBody><p className="sub-error">{error}</p></CardBody></Card>
      ) : data ? (
        data.members.length > 0 ? (
          <ul className="sub-list stagger">
            {data.members.map((m) => (
              <MemberRow key={m.qq} member={m} admin={admin} onEdit={() => setEditTarget(m)} />
            ))}
          </ul>
        ) : (
          <Empty icon={Receipt} title="暂无会员" hint="还没有用户开通会员订阅。" />
        )
      ) : null}

      {editTarget && (
        <EditMemberModal
          member={editTarget}
          onClose={() => setEditTarget(null)}
          onDone={() => {
            setEditTarget(null);
            void reload();
          }}
        />
      )}
      <NewMemberModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onDone={() => {
          setNewOpen(false);
          void reload();
        }}
      />
    </>
  );
}

function MemberRow({
  member,
  admin,
  onEdit,
}: {
  member: SubscriptionMember;
  admin: boolean;
  onEdit: () => void;
}) {
  const display = member.nickname?.trim() || `QQ ${member.qq}`;
  const days = remainingDays(member.memberUntil);
  const expired = member.memberUntil !== null && days !== null && days <= 0;
  return (
    <li className="sub-row">
      <img
        className="sub-avatar"
        src={`https://q.qlogo.cn/headimg_dl?dst_uin=${member.qq}&spec=100`}
        alt={display}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <div className="sub-row-main">
        <div className="sub-row-head">
          <span className="sub-row-name">{display}</span>
          <RoleBadge role={member.role} className="ml-1.5" />
          {expired && <Badge variant="closed">已过期</Badge>}
        </div>
        <span className="sub-row-meta">
          QQ {member.qq} · 会员至 {member.memberUntil ? formatMs(member.memberUntil) : "—"}
          {member.memberUntil && days !== null && days > 0 ? ` · 剩 ${days} 天` : ""}
        </span>
      </div>
      {admin && (
        <Button size="sm" variant="soft" onClick={onEdit}>
          <CalendarClock size={13} /> 管理
        </Button>
      )}
    </li>
  );
}

function toLocalInput(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(s: string): number | null {
  if (!s) return null;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}

function EditMemberModal({
  member,
  onClose,
  onDone,
}: {
  member: SubscriptionMember;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [until, setUntil] = useState(toLocalInput(member.memberUntil));
  const [busy, setBusy] = useState(false);

  const submit = async (close: boolean) => {
    setBusy(true);
    try {
      const memberUntil = close ? null : fromLocalInput(until);
      if (!close && memberUntil === null) {
        toast.error("请填写失效时间");
        return;
      }
      await api.post<SetMembershipRes>("/subscriptions/membership", { qq: member.qq, memberUntil });
      toast.success(close ? "已关闭订阅" : "订阅已更新");
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={`管理 ${member.nickname || member.qq} 的订阅`}
      onClose={onClose}
      onConfirm={() => void submit(false)}
      confirmText="保存"
      busy={busy}
    >
      <div className="sub-edit-form">
        <div>
          <label className="field-label">会员失效时间</label>
          <input
            type="datetime-local"
            className="sub-dt-input"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
          <p className="input-hint">清空时间并点「关闭订阅」可立即终止会员。</p>
        </div>
        <Button variant="danger" size="sm" loading={busy} onClick={() => void submit(true)}>
          关闭订阅
        </Button>
      </div>
    </Modal>
  );
}

function NewMemberModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [qq, setQq] = useState("");
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = Number(qq.trim());
    if (!n) {
      toast.error("请输入 QQ 号");
      return;
    }
    const memberUntil = fromLocalInput(until);
    if (memberUntil === null) {
      toast.error("请选择失效时间");
      return;
    }
    setBusy(true);
    try {
      await api.post<SetMembershipRes>("/subscriptions/membership", { qq: n, memberUntil });
      toast.success("订阅已开通");
      setQq("");
      setUntil("");
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="设置订阅"
      onClose={onClose}
      onConfirm={() => void submit()}
      confirmText="开通"
      busy={busy}
    >
      <div className="sub-edit-form">
        <Input
          label="QQ 号"
          type="number"
          placeholder="目标 QQ"
          value={qq}
          onChange={(e) => setQq(e.target.value)}
        />
        <div>
          <label className="field-label">会员失效时间</label>
          <input
            type="datetime-local"
            className="sub-dt-input"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function RedeemsSection() {
  const { data, loading, error } = useFetch<SubscriptionsRedeemsRes>("/subscriptions/redeems");

  if (loading) return <div className="sub-loading"><Spinner /></div>;
  if (error) return <Card soft><CardBody><p className="sub-error">{error}</p></CardBody></Card>;
  if (!data) return null;

  if (data.redeems.length === 0) {
    return <Empty icon={Receipt} title="暂无兑换记录" hint="还没有用户兑换过卡密。" />;
  }

  return (
    <ul className="sub-list stagger">
      {data.redeems.map((r) => {
        const display = r.nickname?.trim() || `QQ ${r.qq}`;
        return (
          <li key={r.id} className="sub-row">
            <img
              className="sub-avatar"
              src={`https://q.qlogo.cn/headimg_dl?dst_uin=${r.qq}&spec=100`}
              alt={display}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
            <div className="sub-row-main">
              <div className="sub-row-head">
                <span className="sub-row-name">{display}</span>
                <Badge variant="member">
                  {r.kind === "month" ? "月卡" : r.kind === "quarter" ? "季卡" : "年卡"}
                </Badge>
                <span className="sub-redeem-days">+{r.days} 天</span>
              </div>
              <span className="sub-row-meta">
                生效 {r.beforeMemberUntil ? formatMs(r.beforeMemberUntil) : "即时"} → 失效{" "}
                {formatMs(r.afterMemberUntil)} · {formatMs(r.createdAt)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
