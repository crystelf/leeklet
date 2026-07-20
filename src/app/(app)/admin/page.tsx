"use client";

import { useState } from "react";
import {
  Shield,
  UserPlus,
  UserMinus,
  Users,
  Crown,
} from "lucide-react";
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
import "./admin.css";

export default function AdminPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch<AdminListRes>("/admin/internals");
  const toast = useToast();
  const [qqInput, setQqInput] = useState("");
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
              hint="此页面用于管理内部成员与管理员名单。"
            />
          </CardBody>
        </Card>
      </>
    );
  }

  const addOne = async (kind: "internals" | "admins") => {
    const qq = Number(qqInput.trim());
    if (!qq) {
      toast.error("请输入 QQ 号");
      return;
    }
    setBusy(`${kind}:add`);
    try {
      await api.post<AdminModifyRes>(`/admin/${kind}`, { qq, add: true });
      toast.success(`已添加 ${qq}`);
      setQqInput("");
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(null);
    }
  };

  const removeOne = async (kind: "internals" | "admins", qq: number) => {
    setBusy(`${kind}:rm:${qq}`);
    try {
      await api.post<AdminModifyRes>(`/admin/${kind}`, { qq, add: false });
      toast.success(`已移除 ${qq}`);
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
        subtitle="管理内部成员与管理员名单"
      />

      <Card className="mb-5">
        <CardBody>
          <h3 className="admin-section-title">添加成员</h3>
          <p className="admin-section-sub">输入 QQ 号，加入内部成员或管理员；移除从下方列表操作。</p>
          <div className="admin-input-row">
            <Input
              type="number"
              placeholder="目标 QQ 号"
              value={qqInput}
              onChange={(e) => setQqInput(e.target.value)}
            />
            <Button
              variant="soft"
              onClick={() => void addOne("internals")}
              loading={busy === "internals:add"}
              disabled={!qqInput.trim()}
            >
              <UserPlus size={14} /> 加内部
            </Button>
            <Button
              onClick={() => void addOne("admins")}
              loading={busy === "admins:add"}
              disabled={!qqInput.trim()}
            >
              <Crown size={14} /> 加管理员
            </Button>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className="admin-loading"><Spinner /></div>
      ) : error ? (
        <Card soft><CardBody><p className="admin-error">{error}</p></CardBody></Card>
      ) : data ? (
        <div className="admin-lists stagger">
          <RoleList
            title="内部成员"
            icon={<Users size={16} />}
            variant="internal"
            list={data.internals}
            selfQq={user.qq}
            busy={busy}
            onRemove={(qq) => void removeOne("internals", qq)}
          />
          <RoleList
            title="管理员"
            icon={<Crown size={16} />}
            variant="admin"
            list={data.admins}
            selfQq={user.qq}
            busy={busy}
            onRemove={(qq) => void removeOne("admins", qq)}
          />
        </div>
      ) : null}
    </>
  );
}

function RoleList({
  title,
  icon,
  variant,
  list,
  selfQq,
  busy,
  onRemove,
}: {
  title: string;
  icon: React.ReactNode;
  variant: "internal" | "admin";
  list: number[];
  selfQq: number;
  busy: string | null;
  onRemove: (qq: number) => void;
}) {
  return (
    <Card>
      <CardBody>
        <div className="admin-list-head">
          <span className="admin-list-icon">{icon}</span>
          <h3 className="admin-list-title">{title}</h3>
          <Badge variant={variant}>{list.length}</Badge>
        </div>
        {list.length > 0 ? (
          <ul className="admin-list">
            {list.map((qq) => (
              <li key={qq} className="admin-list-item">
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
