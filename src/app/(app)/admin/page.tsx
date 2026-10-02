"use client";

import { useState } from "react";
import { Shield, UserPlus, UserMinus, Users, Crown } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type { AdminListRes, AdminModifyRes } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import "./admin.css";

export default function AdminPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch<AdminListRes>("/admin/internals");
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  if (user?.role !== "admin") {
    return (
      <>
        <PageHeader icon={<Shield size={22} />} title="管理" />
        <Card soft>
          <CardBody>
            <Empty
              icon={Shield}
              title="仅管理员可访问"
              hint="此页面用于管理内部会员与管理员名单。"
            />
          </CardBody>
        </Card>
      </>
    );
  }

  const modify = async (kind: "internals" | "admins", qq: number, add: boolean) => {
    setBusy(`${kind}:${add ? "add" : "rm"}:${qq}`);
    try {
      await api.post<AdminModifyRes>(`/admin/${kind}`, { qq, add });
      toast.success(add ? `已添加 ${qq}` : `已移除 ${qq}`);
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        icon={<Shield size={22} />}
        title="管理后台"
        subtitle="管理内部会员与管理员名单"
      />

      {loading ? (
        <div className="admin-loading"><Spinner /></div>
      ) : error ? (
        <Card soft><CardBody><p className="admin-error">{error}</p></CardBody></Card>
      ) : data ? (
        <div className="admin-lists stagger">
          <RoleSection
            title="内部会员"
            description="将 QQ 号加入内部会员名单，仅管理员可操作。"
            icon={<Users size={16} />}
            fallbackIcon={<Users size={20} strokeWidth={1.6} />}
            variant="internal"
            list={data.internals}
            selfQq={user.qq}
            busy={busy}
            onAdd={(qq) => void modify("internals", qq, true)}
            onRemove={(qq) => void modify("internals", qq, false)}
          />
          <RoleSection
            title="管理员"
            description="将 QQ 号加入管理员名单，仅管理员可操作。"
            icon={<Crown size={16} />}
            fallbackIcon={<Crown size={20} strokeWidth={1.6} />}
            variant="admin"
            list={data.admins}
            selfQq={user.qq}
            busy={busy}
            onAdd={(qq) => void modify("admins", qq, true)}
            onRemove={(qq) => void modify("admins", qq, false)}
          />
        </div>
      ) : null}
    </>
  );
}

function RoleSection({
  title,
  description,
  icon,
  fallbackIcon,
  variant,
  list,
  selfQq,
  busy,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  fallbackIcon: React.ReactNode;
  variant: "internal" | "admin";
  list: number[];
  selfQq: number;
  busy: string | null;
  onAdd: (qq: number) => void;
  onRemove: (qq: number) => void;
}) {
  const [qqInput, setQqInput] = useState("");
  const inputQq = Number(qqInput.trim());

  const add = () => {
    if (!inputQq) return;
    onAdd(inputQq);
    setQqInput("");
  };

  return (
    <Card>
      <CardBody>
        <div className="admin-list-head">
          <span className="admin-list-icon">{icon}</span>
          <h3 className="admin-list-title">{title}</h3>
          <Badge variant={variant}>{list.length}</Badge>
        </div>
        <p className="admin-section-sub">{description}</p>
        <div className="admin-input-row">
          <Input
            type="number"
            placeholder="QQ 号"
            value={qqInput}
            onChange={(e) => setQqInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
          />
          <Button
            variant="soft"
            size="sm"
            onClick={add}
            disabled={!qqInput.trim() || !!busy}
          >
            <UserPlus size={14} /> 添加
          </Button>
        </div>
        {list.length > 0 ? (
          <ul className="admin-list admin-member-list">
            {list.map((qq) => (
              <li key={qq} className="admin-list-item admin-member-row">
                <Avatar qq={qq} fallback={fallbackIcon} />
                <span className="admin-list-qq">{qq}</span>
                {qq === selfQq && <Badge variant="pending">你自己</Badge>}
                {qq !== selfQq && (
                  <button
                    className="admin-list-remove"
                    onClick={() => onRemove(qq)}
                    disabled={!!busy}
                    aria-label={`移除 ${qq}`}
                  >
                    <UserMinus size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-list-empty">暂无</p>
        )}
      </CardBody>
    </Card>
  );
}

function Avatar({ qq, fallback }: { qq: number; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);

  if (failed || !qq) {
    return <span className="admin-avatar-fallback">{fallback}</span>;
  }
  return (
    <img
      className="admin-avatar"
      src={`https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=160`}
      alt={`QQ ${qq}`}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
