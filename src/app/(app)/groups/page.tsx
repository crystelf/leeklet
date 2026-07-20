"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Crown,
  Shield,
  CheckCircle2,
  Settings,
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

  const [claimTarget, setClaimTarget] = useState<ManagedGroup | null>(null);

  const claimed = data?.filter((g) => g.claimed) ?? [];
  const unclaimed = data?.filter((g) => !g.claimed) ?? [];

  return (
    <>
      <PageHeader
        icon={<Users size={22} />}
        title="群管理"
        subtitle={
          data?.length
            ? `共 ${data.length} 个群 · ${claimed.length} 已就绪`
            : "认领你管理的群，进入功能控制面板"
        }
      />

      {loading ? (
        <div className="groups-loading">
          <Spinner />
          <p className="groups-loading-text">正在检索全部群聊</p>
        </div>
      ) : error ? (
        <Card soft><CardBody><p className="groups-error">{error}</p></CardBody></Card>
      ) : !data || data.length === 0 ? (
        <Empty
          icon={Users}
          title="还没有管理的群"
          hint="认领你作为群主或管理员的群，即可在这里管理。bot 必须已加入该群。"
        />
      ) : (
        <div className="groups-stack">
          {unclaimed.length > 0 && (
            <section className="groups-section">
              <header className="groups-section-head">
                <span className="groups-section-bar" />
                <h3 className="groups-section-title">
                  待认领 <span className="groups-section-count">{unclaimed.length}</span>
                </h3>
                <p className="groups-section-hint">认领后才能进入功能控制</p>
              </header>
              <div className="groups-grid stagger">
                {unclaimed.map((g, i) => (
                  <GroupCard
                    key={g.groupId}
                    group={g}
                    onClaim={() => setClaimTarget(g)}
                    order={i}
                    total={unclaimed.length}
                  />
                ))}
              </div>
            </section>
          )}

          {claimed.length > 0 && (
            <section className="groups-section">
              <header className="groups-section-head">
                <span className="groups-section-bar" />
                <h3 className="groups-section-title">
                  已就绪 <span className="groups-section-count">{claimed.length}</span>
                </h3>
                <p className="groups-section-hint">可直接进入功能控制</p>
              </header>
              <div className="groups-grid stagger">
                {claimed.map((g, i) => (
                  <GroupCard key={g.groupId} group={g} order={i} total={claimed.length} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ClaimDialog
        target={claimTarget}
        onClose={() => setClaimTarget(null)}
        onDone={() => {
          setClaimTarget(null);
          void reload();
        }}
      />
    </>
  );
}

function GroupCard({
  group,
  onClaim,
  order,
  total,
}: {
  group: ManagedGroup;
  onClaim?: () => void;
  order: number;
  total: number;
}) {
  const isClaimed = group.claimed;

  return (
    <Card className={`group-card ${isClaimed ? "" : "group-card-unclaimed"}`}>
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
            <p className="group-card-id">
              {group.groupId} · {group.memberCount} 人
            </p>
          </div>
          <span className="group-card-role" title={group.role === "owner" ? "群主" : "管理员"}>
            {group.role === "owner" ? <Crown size={12} /> : <Shield size={12} />}
          </span>
        </div>

        <div className="group-card-foot">
          {isClaimed ? (
            <a href={`/control?groupId=${group.groupId}`} className="group-card-cta">
              <Button variant="primary" size="sm" className="w-full group-card-cta-btn">
                <Settings size={13} /> 功能控制 →
              </Button>
            </a>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full group-card-cta-btn"
              onClick={onClaim}
            >
              <Plus size={13} /> 认领这个群
            </Button>
          )}
        </div>

        {!isClaimed && order === 0 && total > 1 && (
          <p className="group-card-hint">还有 {total - 1} 个待认领</p>
        )}
      </CardBody>
    </Card>
  );
}

function ClaimDialog({
  target,
  onClose,
  onDone,
}: {
  target: ManagedGroup | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<GroupClaimReq>({
    groupId: target?.groupId ?? 0,
    topic: "",
    botQqs: [],
    channel: "朋友推荐",
  });
  const [botQqsText, setBotQqsText] = useState("");

  const submit = async () => {
    if (!target) return;
    if (!form.topic) {
      toast.error("请填写主要话题");
      return;
    }
    setBusy(true);
    try {
      await api.post("/groups/claim", {
        ...form,
        groupId: target.groupId,
        botQqs: botQqsText
          .split(/[,，\s]+/)
          .map((s) => Number(s.trim()))
          .filter((n) => n > 0),
      });
      toast.success(`${target.groupName || `群 ${target.groupId}`} 已认领`);
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "认领失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={target != null}
      title={target ? `认领「${target.groupName || `群 ${target.groupId}`}」` : ""}
      description="补全认领信息后即可在功能控制面板对该群进行管理。"
      confirmText="提交认领"
      busy={busy}
      onConfirm={submit}
      onClose={onClose}
    >
      <div className="claim-form">
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
          <option>群内看到</option>
          <option>搜索引擎</option>
          <option>社交平台</option>
          <option>其他</option>
        </Select>
      </div>
    </Modal>
  );
}
