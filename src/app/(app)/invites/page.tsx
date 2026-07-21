"use client";

import { useState } from "react";
import {
  MailCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type {
  InvitesRes,
  Invite,
  InviteStatus,
} from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import { isStaff, formatRelative } from "@/lib/format";
import "./invites.css";

export default function InvitesPage() {
  const { user } = useAuth();
  const staff = isStaff(user?.role);
  const [submitOpen, setSubmitOpen] = useState(false);
  const { data: mine, loading, error, reload } = useFetch<InvitesRes>("/invites/mine");
  const [reviewTarget, setReviewTarget] = useState<Invite | null>(null);

  return (
    <>
      <PageHeader
        icon={<MailCheck size={22} />}
        title="邀请审批"
        subtitle={staff ? "提交拉群申请，并审批其他人的申请" : "提交拉群申请，跟踪审批状态"}
        actions={
          <Button size="sm" onClick={() => setSubmitOpen(true)}>
            <Plus size={14} /> 提交申请
          </Button>
        }
      />

      <h3 className="invites-section-title">我的申请</h3>
      {loading ? (
        <div className="invites-loading"><Spinner /></div>
      ) : error ? (
        <Card soft><CardBody><p className="invites-error">{error}</p></CardBody></Card>
      ) : mine?.invites.length ? (
        <div className="invites-grid stagger">
          {mine.invites.map((iv) => (
            <InviteCard key={iv.id} invite={iv} />
          ))}
        </div>
      ) : (
        <Empty
          icon={MailCheck}
          title="还没有提交过申请"
          hint="把想拉 bot 进去的群提交申请，内部成员会尽快审批。"
          action={<Button size="sm" onClick={() => setSubmitOpen(true)}><Plus size={14} /> 提交第一个</Button>}
        />
      )}

      {staff && <ReviewSection onReview={setReviewTarget} />}

      <SubmitDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onDone={() => {
          setSubmitOpen(false);
          void reload();
        }}
      />

      <ReviewDialog
        invite={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onDone={() => {
          setReviewTarget(null);
          void reload();
        }}
      />
    </>
  );
}

function statusBadge(s: InviteStatus) {
  const map = {
    pending: { v: "pending", label: "待审批", icon: <Clock size={11} /> },
    approved: { v: "ok", label: "已通过", icon: <CheckCircle2 size={11} /> },
    rejected: { v: "closed", label: "已拒绝", icon: <XCircle size={11} /> },
  } as const;
  const m = map[s];
  return (
    <Badge variant={m.v}>
      {m.icon} {m.label}
    </Badge>
  );
}

function UserChip({
  qq,
  nickname,
}: {
  qq: number;
  nickname?: string | null;
}) {
  const display = nickname?.trim() || "未知用户";
  return (
    <span className="invite-user-chip">
      <img
        className="invite-avatar"
        src={`https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=100`}
        alt={display}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <span className="invite-user-name">{display}</span>
    </span>
  );
}

function CopyGroupId({ groupId }: { groupId: number }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(groupId));
      setCopied(true);
      toast.success("群号已复制");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <button type="button" className="invite-copy-btn" onClick={() => void copy()} title="复制群号">
      群号 {groupId}
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function InviteCard({
  invite,
  showApplicant,
  onReview,
}: {
  invite: Invite;
  showApplicant?: boolean;
  onReview?: (iv: Invite) => void;
}) {
  return (
    <Card className="invite-card">
      <CardBody className="invite-card-body">
        <div className="invite-card-head">
          <div className="invite-card-title-wrap">
            <span className="invite-card-topic">{invite.topic}</span>
            <span className="invite-card-time">{formatRelative(invite.createdAt)}</span>
          </div>
          {statusBadge(invite.status)}
        </div>

        <div className="invite-card-row">
          <CopyGroupId groupId={invite.groupId} />
          {showApplicant && (
            <UserChip qq={invite.applicantQq} nickname={invite.applicantNickname} />
          )}
        </div>

        <div className="invite-card-tags">
          <span>渠道：{invite.channel || "—"}</span>
          <span>bot {invite.botQqs.length} 个</span>
          <span>{invite.allowBotAdmin ? "允许 bot 管理员" : "禁止 bot 管理员"}</span>
        </div>

        {invite.status !== "pending" && invite.reviewReason && (
          <div className="invite-card-review">
            <span className="invite-card-label">审批意见</span>
            <p className="invite-card-review-text">{invite.reviewReason}</p>
          </div>
        )}

        {invite.status === "pending" && onReview && (
          <div className="invite-card-footer">
            <Button size="sm" onClick={() => onReview(invite)}>
              <UserCheck size={13} /> 去审批
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ReviewSection({ onReview }: { onReview: (iv: Invite) => void }) {
  const [status, setStatus] = useState<InviteStatus | "all">("pending");
  const { data, loading } = useFetch<InvitesRes>(
    `/invites/all${status !== "all" ? `?status=${status}` : ""}`,
    [status],
  );

  return (
    <>
      <h3 className="invites-section-title">审批中心</h3>
      <div className="tab-bar invites-filter">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            className="tab"
            data-active={status === s}
            onClick={() => setStatus(s)}
          >
            {s === "pending" ? "待审批" : s === "approved" ? "已通过" : s === "rejected" ? "已拒绝" : "全部"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="invites-loading"><Spinner /></div>
      ) : data?.invites.length ? (
        <div className="invites-grid stagger">
          {data.invites.map((iv) => (
            <InviteCard
              key={iv.id}
              invite={iv}
              showApplicant
              onReview={onReview}
            />
          ))}
        </div>
      ) : (
        <Empty icon={CheckCircle2} title="没有待审批的申请" />
      )}
    </>
  );
}

function SubmitDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    groupId: 0,
    topic: "",
    botQqsText: "",
    channel: "朋友推荐",
    allowBotAdmin: false,
  });

  const submit = async () => {
    if (!form.groupId || !form.topic) {
      toast.error("请填写群号和主要话题");
      return;
    }
    setBusy(true);
    try {
      await api.post("/invites", {
        groupId: form.groupId,
        topic: form.topic,
        botQqs: form.botQqsText
          .split(/[,，\s]+/)
          .map((s) => Number(s.trim()))
          .filter((n) => n > 0),
        channel: form.channel,
        allowBotAdmin: form.allowBotAdmin,
      });
      toast.success("申请已提交");
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "提交失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="提交拉群申请"
      description="把想拉 bot 进去的群提交申请，内部成员会尽快审批。"
      confirmText="提交申请"
      busy={busy}
      onConfirm={submit}
      onClose={onClose}
    >
      <div className="invites-form">
        <Input
          label="群号"
          type="number"
          placeholder="987654321"
          required
          onChange={(e) => setForm({ ...form, groupId: Number(e.target.value) })}
        />
        <Input
          label="主要话题"
          placeholder="技术交流 / 兴趣分享"
          required
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
        />
        <Input
          label="群内机器人 QQ"
          placeholder="多个用逗号分隔"
          onChange={(e) => setForm({ ...form, botQqsText: e.target.value })}
        />
        <Select
          label="了解渠道"
          defaultValue="朋友推荐"
          onChange={(e) => setForm({ ...form, channel: e.target.value })}
        >
          <option>朋友推荐</option>
          <option>群内看到</option>
          <option>搜索引擎</option>
          <option>社交平台</option>
          <option>其他</option>
        </Select>
        <label className="invites-checkbox">
          <input
            type="checkbox"
            onChange={(e) => setForm({ ...form, allowBotAdmin: e.target.checked })}
          />
          <span>允许 bot 管理员加入群聊</span>
        </label>
      </div>
    </Modal>
  );
}

function ReviewDialog({
  invite,
  onClose,
  onDone,
}: {
  invite: Invite | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [approved, setApproved] = useState(true);

  const submit = async () => {
    if (!invite) return;
    setBusy(true);
    try {
      await api.post("/invites/review", {
        id: invite.id,
        approved,
        reason: reason || undefined,
      });
      toast.success(approved ? "已通过" : "已拒绝");
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "审批失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!invite}
      title="审批邀请"
      description={
        invite
          ? `群 ${invite.groupId} · ${invite.topic}`
          : ""
      }
      confirmText={approved ? "通过" : "拒绝"}
      busy={busy}
      onConfirm={submit}
      onClose={onClose}
    >
      <div className="invites-review-form">
        {invite && (
          <div className="invite-review-applicant">
            <UserChip qq={invite.applicantQq} nickname={invite.applicantNickname} />
            <CopyGroupId groupId={invite.groupId} />
          </div>
        )}
        <div className="tab-bar">
          <button className="tab" data-active={approved} onClick={() => setApproved(true)}>
            <CheckCircle2 size={13} /> 通过
          </button>
          <button className="tab" data-active={!approved} onClick={() => setApproved(false)}>
            <XCircle size={13} /> 拒绝
          </button>
        </div>
        <Textarea
          label="审批意见（可选）"
          placeholder="群质量符合要求 / 话题不匹配"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
