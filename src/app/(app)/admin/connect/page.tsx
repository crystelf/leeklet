"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Trash2,
  Users,
  Bot as BotIcon,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import type {
  ConnectAllBotsRes,
  ConnectBot,
  ConnectLimitRes,
  ConnectOwnersRes,
} from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/shell/page-header";
import { isAdmin } from "@/lib/format";
import "./connect-admin.css";

const REFRESH_MS = 5_000;

const STATUS_LABEL: Record<ConnectBot["status"], string> = {
  idle: "离线",
  starting: "启动中",
  awaiting_scan: "需要扫码",
  online: "在线",
};

export default function ConnectAdminPage() {
  const { user } = useAuth();
  const bots = useFetch<ConnectAllBotsRes>("/admin/connect/bots");
  const owners = useFetch<ConnectOwnersRes>("/admin/connect/owners");
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteBot, setDeleteBot] = useState<ConnectBot | null>(null);
  const [limitEdits, setLimitEdits] = useState<Record<number, string>>({});

  const hasActive = (bots.data?.bots ?? []).some((bot) => bot.status !== "idle");

  useEffect(() => {
    const timer = setInterval(() => {
      void bots.reload();
      void owners.reload();
    }, hasActive ? 3_000 : REFRESH_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive]);

  if (!user) return null;
  if (!isAdmin(user.role)) {
    return (
      <>
        <PageHeader icon={<ShieldCheck size={22} />} title="Connect 管理" />
        <Card soft>
          <CardBody>
            <Empty icon={ShieldCheck} title="仅管理员可访问" hint="此页面用于管理所有用户的代挂机器人。" />
          </CardBody>
        </Card>
      </>
    );
  }

  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await action();
      toast.success(done);
      void bots.reload();
      void owners.reload();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(null);
    }
  };

  const toggleBot = (bot: ConnectBot, on: boolean) =>
    run(
      `toggle:${bot.id}`,
      () =>
        on
          ? api.post(`/connect/bots/${bot.id}/login`)
          : api.post(`/connect/bots/${bot.id}/stop`),
      on ? `正在拉起 ${bot.botQq} 的容器` : `已下线 ${bot.botQq}`,
    );

  const removeBot = async () => {
    if (!deleteBot) return;
    await run(
      `remove:${deleteBot.id}`,
      () => api.delete(`/connect/bots/${deleteBot.id}`),
      `已删除 ${deleteBot.botQq}(含数据目录)`,
    );
    setDeleteBot(null);
  };

  const saveLimit = (qq: number) => {
    const raw = (limitEdits[qq] ?? "").trim();
    const limit = raw === "" ? null : Number(raw);
    if (limit !== null && (!Number.isFinite(limit) || limit < 0 || limit > 50)) {
      toast.error("上限需为 0-50 的数字");
      return;
    }
    void run(
      `limit:${qq}`,
      () => api.post<ConnectLimitRes>("/admin/connect/limit", { qq, limit }),
      `已更新 ${qq} 的配额${limit === null ? "(恢复默认)" : `为 ${limit}`}`,
    );
  };

  const reloadAll = async () => {
    await Promise.all([bots.reload(), owners.reload()]);
  };

  const loading = (bots.loading && !bots.data) || (owners.loading && !owners.data);

  return (
    <>
      <PageHeader
        icon={<ShieldCheck size={22} />}
        title="Connect 管理"
        subtitle="管理所有用户的代挂机器人与配额"
        actions={
          <Button variant="soft" size="sm" onClick={() => void reloadAll()} disabled={bots.loading || owners.loading}>
            <RefreshCw size={14} className={bots.loading || owners.loading ? "connect-admin-spin" : undefined} />
            刷新
          </Button>
        }
      />

      {loading ? (
        <div className="connect-admin-loading"><Spinner /></div>
      ) : bots.error ? (
        <Card soft><CardBody><Empty icon={ShieldCheck} title="无法加载" hint={bots.error ?? ""} /></CardBody></Card>
      ) : (
        <div className="connect-admin-sections stagger">
          {/* 全部代挂 bot */}
          <section>
            <h3 className="admin-section-title">
              <BotIcon size={16} />
              全部代挂机器人
              <span className="connect-admin-count">{bots.data?.bots.length ?? 0}</span>
            </h3>
            <p className="admin-section-sub">开关用于拉起/关闭容器;删除将彻底清除数据目录。</p>
            {(bots.data?.bots.length ?? 0) === 0 ? (
              <Card soft>
                <CardBody>
                  <Empty icon={BotIcon} title="暂无代挂机器人" hint="内部会员创建后将展示在这里。" />
                </CardBody>
              </Card>
            ) : (
              <div className="connect-admin-table-wrap">
                <table className="connect-admin-table">
                  <thead>
                    <tr>
                      <th>bot</th>
                      <th>主人</th>
                      <th>状态</th>
                      <th>开关</th>
                      <th className="connect-admin-th-actions">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bots.data?.bots ?? []).map((bot) => (
                      <tr key={bot.id}>
                        <td>
                          <div className="connect-admin-bot">
                            <img
                              className="connect-admin-avatar"
                              src={`https://q.qlogo.cn/headimg_dl?dst_uin=${bot.botQq}&spec=80`}
                              alt=""
                              draggable={false}
                            />
                            <div>
                              <p className="connect-admin-bot-name">{bot.nickname || bot.botQq}</p>
                              <p className="connect-admin-bot-qq">QQ {bot.botQq}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="connect-admin-owner">{bot.ownerQq}</span>
                        </td>
                        <td>
                          <span className={`connect-admin-status is-${bot.status}`}>
                            {bot.status === "online" ? <Wifi size={11} /> : <WifiOff size={11} />}
                            {STATUS_LABEL[bot.status]}
                          </span>
                          {bot.lastError && (
                            <p className="connect-admin-error" title={bot.lastError}>{bot.lastError}</p>
                          )}
                        </td>
                        <td>
                          <Switch
                            checked={bot.status !== "idle"}
                            disabled={busy === `toggle:${bot.id}` || busy === `remove:${bot.id}`}
                            onChange={(on) => void toggleBot(bot, on)}
                            ariaLabel={`开关 ${bot.botQq}`}
                          />
                        </td>
                        <td className="connect-admin-th-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="connect-admin-delete"
                            loading={busy === `remove:${bot.id}`}
                            onClick={() => setDeleteBot(bot)}
                            aria-label="删除"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 配额管理 */}
          <section>
            <h3 className="admin-section-title">
              <Users size={16} />
              托管配额
            </h3>
            <p className="admin-section-sub">为内部会员单独设置可托管数量;留空保存表示恢复默认上限(默认 5)。</p>
            {(owners.data?.owners.length ?? 0) === 0 ? (
              <Card soft>
                <CardBody>
                  <Empty icon={Users} title="暂无内部会员" hint="先在「管理」页添加内部会员。" />
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody>
                  <ul className="connect-admin-owners">
                    {(owners.data?.owners ?? []).map((owner) => (
                      <li key={owner.qq} className="connect-admin-owner-row">
                        <div className="connect-admin-owner-info">
                          <p className="connect-admin-owner-name">
                            {owner.nickname || owner.qq}
                            {owner.override != null && (
                              <span className="connect-admin-override-tag">自定义</span>
                            )}
                          </p>
                          <p className="connect-admin-owner-sub">
                            QQ {owner.qq} · 已托管 {owner.used}/{owner.effective}
                          </p>
                        </div>
                        <div className="connect-admin-limit-row">
                          <input
                            className="input connect-admin-limit-input"
                            inputMode="numeric"
                            placeholder="默认"
                            value={limitEdits[owner.qq] ?? (owner.override != null ? String(owner.override) : "")}
                            onChange={(e) =>
                              setLimitEdits((prev) => ({
                                ...prev,
                                [owner.qq]: e.target.value.replace(/\D/g, ""),
                              }))
                            }
                          />
                          <Button
                            variant="soft"
                            size="sm"
                            loading={busy === `limit:${owner.qq}`}
                            onClick={() => saveLimit(owner.qq)}
                          >
                            保存
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
          </section>
        </div>
      )}

      <Modal
        open={deleteBot !== null}
        title={`删除代挂 ${deleteBot?.botQq ?? ""}`}
        description="将停止容器并彻底删除数据目录(包括 QQ 登录态),此操作不可恢复。"
        confirmText="删除"
        variant="danger"
        busy={busy === `remove:${deleteBot?.id}`}
        onConfirm={() => void removeBot()}
        onClose={() => setDeleteBot(null)}
      >
        <span />
      </Modal>
    </>
  );
}
