"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Crown,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type { GroupsManagedRes, ManagedGroup, GroupClaimReq } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import "./groups.css";

export default function GroupsPage() {
  const { user } = useAuth();
  const qq = user?.qq;
  const { data, loading, error, reload } = useFetch<GroupsManagedRes>(
    qq ? `/groups/managed?qq=${qq}` : null,
    [qq]
  );
  const [claimOpen, setClaimOpen] = useState(false);

  return (
    <>
      <PageHeader
        icon={<Users size={22} />}
        title="群管理"
        subtitle="认领你管理的群，进入功能控制面板"
        actions={
          <Button size="sm" onClick={() => setClaimOpen(true)}>
            <Plus size={14} /> 认领新群
          </Button>
        }
      />

      {loading ? (
        <div className="groups-loading"><Spinner /></div>
      ) : error ? (
        <Card soft><CardBody><p className="groups-error">{error}</p></CardBody></Card>
      ) : data && data.length > 0 ? (
        <div className="groups-grid">
          {data.map((g) => (
            <GroupCard key={g.groupId} group={g} />
          ))}
        </div>
      ) : (
        <Empty
          icon={Users}
          title="还没有管理的群"
          hint="认领你作为群主或管理员的群，即可在这里管理。bot 必须已加入该群。"
          action={
            <Button size="sm" onClick={() => setClaimOpen(true)}>
              <Plus size={14} /> 认领第一个群
            </Button>
          }
        />
      )}

      <ClaimDialog
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onDone={() => {
          setClaimOpen(false);
          void reload();
        }}
      />
    </>
  );
}

function GroupCard({ group }: { group: ManagedGroup }) {
  return (
    <Card className="group-card">
      <CardBody>
        <div className="group-card-head">
          <img
            src={group.groupAvatar}
            alt=""
            className="group-card-avatar"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
          <div className="group-card-info">
            <h3 className="group-card-name">{group.groupName || `群 ${group.groupId}`}</h3>
            <p className="group-card-id">{group.groupId} · {group.memberCount} 人</p>
          </div>
          <span className="group-card-role">
            {group.role === "owner" ? <Crown size={14} /> : <Shield size={14} />}
            {group.role === "owner" ? "群主" : "管理员"}
          </span>
        </div>

        <div className="group-card-stats">
          <Stat
            ok={group.claimed}
            label={group.claimed ? "已认领" : "未认领"}
            okIcon={<CheckCircle2 size={13} />}
            noIcon={<XCircle size={13} />}
          />
          <Stat
            ok={group.botEnabled}
            label={group.botEnabled ? "Bot 在线" : "Bot 已关"}
            okIcon={<CheckCircle2 size={13} />}
            noIcon={<XCircle size={13} />}
          />
        </div>

        <div className="group-card-actions">
          <a href={`/control?groupId=${group.groupId}`}>
            <Button variant="primary" size="sm">
              功能控制 →
            </Button>
          </a>
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({
  ok,
  label,
  okIcon,
  noIcon,
}: {
  ok: boolean;
  label: string;
  okIcon: React.ReactNode;
  noIcon: React.ReactNode;
}) {
  return (
    <span className={`group-stat ${ok ? "group-stat-ok" : "group-stat-no"}`}>
      {ok ? okIcon : noIcon}
      {label}
    </span>
  );
}

function ClaimDialog({
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
  const [form, setForm] = useState<GroupClaimReq>({
    groupId: 0,
    topic: "",
    botQqs: [],
    channel: "朋友推荐",
  });
  const [botQqsText, setBotQqsText] = useState("");

  const submit = async () => {
    if (!form.groupId || !form.topic) {
      toast.error("请填写群号和主要话题");
      return;
    }
    setBusy(true);
    try {
      await api.post("/groups/claim", {
        ...form,
        botQqs: botQqsText
          .split(/[,，\s]+/)
          .map((s) => Number(s.trim()))
          .filter((n) => n > 0),
      });
      toast.success("认领成功");
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "认领失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="认领新群"
      description="认领你作为群主或管理员的群。bot 必须已加入该群才能识别你的身份。"
      confirmText="提交认领"
      busy={busy}
      onConfirm={submit}
      onClose={onClose}
    >
      <div className="claim-form">
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
          hint="群内 bot 的 QQ 号，可填多个"
          onChange={(e) => setBotQqsText(e.target.value)}
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
      </div>
    </Modal>
  );
}
