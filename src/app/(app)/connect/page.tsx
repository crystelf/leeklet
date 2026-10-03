"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Share2,
  Play,
  Square,
  QrCode,
  Trash2,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  X,
  Circle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import type {
  ConnectBot,
  ConnectBotsRes,
  ConnectProgressRes,
  ConnectProgressStep,
} from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/shell/page-header";
import { hasRole } from "@/lib/format";
import "./connect.css";

const LIST_REFRESH_MS = 5_000;
const ACTIVE_REFRESH_MS = 3_000;
const PROGRESS_POLL_MS = 2_000;

const STATUS_LABEL: Record<ConnectBot["status"], string> = {
  idle: "离线",
  starting: "启动中",
  awaiting_scan: "需要扫码",
  online: "在线",
};

export default function ConnectPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch<ConnectBotsRes>("/connect/bots");
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createQq, setCreateQq] = useState("");
  const [panelBot, setPanelBot] = useState<ConnectBot | null>(null);
  const [deleteBot, setDeleteBot] = useState<ConnectBot | null>(null);

  // 存在进行中的任务时加快轮询
  const hasActive = useMemo(
    () => (data?.bots ?? []).some((bot) => bot.status !== "idle"),
    [data],
  );

  useEffect(() => {
    const timer = setInterval(
      () => void reload(),
      hasActive ? ACTIVE_REFRESH_MS : LIST_REFRESH_MS
    );
    return () => clearInterval(timer);
  }, [reload, hasActive]);

  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await action();
      toast.success(done);
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(null);
    }
  };

  if (!user) return null;
  if (!hasRole(user.role, "internal")) {
    return (
      <>
        <PageHeader icon={<Share2 size={22} />} title="Connect" />
        <Card soft>
          <CardBody>
            <Empty
              icon={Share2}
              title="内部会员专属"
              hint="Connect 代挂功能仅对内部会员及以上开放。"
            />
          </CardBody>
        </Card>
      </>
    );
  }

  const create = async () => {
    const qq = createQq.trim();
    if (!/^\d{5,11}$/.test(qq)) {
      toast.error("请输入 5-11 位数字的 QQ 号");
      return;
    }
    await run("create", () => api.post("/connect/bots", { qq: Number(qq) }), "已创建,点击登录开始托管");
    setCreateQq("");
    setCreateOpen(false);
  };

  const stop = (bot: ConnectBot) =>
    run(`stop:${bot.id}`, () => api.post(`/connect/bots/${bot.id}/stop`), `已下线 ${bot.botQq}`);
  const remove = async (bot: ConnectBot) => {
    await run(`remove:${bot.id}`, () => api.delete(`/connect/bots/${bot.id}`), `已删除 ${bot.botQq}(含数据目录)`);
    setDeleteBot(null);
  };

  const bots = data?.bots ?? [];
  const quota = data?.quota;
  const onlineCount = bots.filter((bot) => bot.status === "online").length;

  return (
    <>
      <PageHeader
        icon={<Share2 size={22} />}
        title="Connect"
        subtitle="托管自己的代挂机器人"
        actions={
          <div className="connect-actions">
            <Button variant="soft" size="sm" onClick={() => void reload()} disabled={loading}>
              <RefreshCw size={14} className={loading ? "connect-spin" : undefined} />
              刷新
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              创建代挂
            </Button>
          </div>
        }
      />

      <div className="connect-stats stagger">
        <StatCard
          label="托管配额"
          value={quota ? `${quota.used}/${quota.max}` : "—"}
          hint={quota?.override != null ? "管理员已单独调高配额" : `默认上限 ${quota?.default ?? 5}`}
        />
        <StatCard label="在线" value={String(onlineCount)} tone="online" hint="反向连接正常" />
        <StatCard
          label="等待扫码"
          value={String(bots.filter((bot) => bot.status === "awaiting_scan").length)}
          tone="warn"
          hint="容器运行中,等待登录"
        />
      </div>

      {error ? (
        <Card soft>
          <CardBody>
            <Empty
              icon={WifiOff}
              title="无法加载 Connect 列表"
              hint={error}
              action={
                <Button variant="soft" size="sm" className="mt-3" onClick={() => void reload()}>
                  重试
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : loading && !data ? (
        <Card soft className="connect-loading">
          <Spinner />
        </Card>
      ) : bots.length === 0 ? (
        <Card soft>
          <CardBody>
            <Empty
              icon={Share2}
              title="还没有托管机器人"
              hint="输入 bot 的 QQ 号创建,系统将自动分配部署目录。"
              action={
                <Button variant="primary" size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
                  <Plus size={14} />
                  创建代挂
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="connect-grid stagger">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              busy={busy}
              onLogin={() => setPanelBot(bot)}
              onStop={() => void stop(bot)}
              onQr={() => setPanelBot(bot)}
              onDelete={() => setDeleteBot(bot)}
            />
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        title="创建代挂机器人"
        description="输入 bot 的 QQ 号,系统会自动生成部署目录;创建后不会立即启动。"
        confirmText="创建"
        busy={busy === "create"}
        onConfirm={() => void create()}
        onClose={() => setCreateOpen(false)}
      >
        <Input
          label="bot QQ 号"
          value={createQq}
          onChange={(e) => setCreateQq(e.target.value.replace(/\D/g, ""))}
          placeholder="5-11 位数字"
          inputMode="numeric"
          maxLength={11}
          autoFocus
        />
      </Modal>

      <Modal
        open={deleteBot !== null}
        title={`删除代挂 ${deleteBot?.botQq ?? ""}`}
        description="将停止容器并彻底删除数据目录(包括 QQ 登录态),此操作不可恢复。"
        confirmText="删除"
        variant="danger"
        busy={busy === `remove:${deleteBot?.id}`}
        onConfirm={() => {
          if (deleteBot) void remove(deleteBot);
        }}
        onClose={() => setDeleteBot(null)}
      >
        <span />
      </Modal>

      {panelBot && (
        <ConnectLoginPanel
          bot={panelBot}
          onClose={() => {
            setPanelBot(null);
            void reload();
          }}
        />
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
  value: string;
  tone?: "online" | "warn";
  hint: string;
}) {
  return (
    <Card className="connect-stat-card">
      <CardBody>
        <div className="connect-stat-top">{label}</div>
        <div className={`connect-stat-num${tone ? ` is-${tone}` : ""}`}>{value}</div>
        <p className="text-xs" style={{ color: "var(--fg-muted)", margin: 0 }}>
          {hint}
        </p>
      </CardBody>
    </Card>
  );
}

function BotCard({
  bot,
  busy,
  onLogin,
  onStop,
  onQr,
  onDelete,
}: {
  bot: ConnectBot;
  busy: string | null;
  onLogin: () => void;
  onStop: () => void;
  onQr: () => void;
  onDelete: () => void;
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const name = bot.nickname || String(bot.botQq);

  return (
    <Card className="connect-card">
      <CardBody>
        <div className="connect-card-head">
          {avatarFailed || !bot.botQq ? (
            <span className="connect-avatar-fallback" aria-label={name}>
              <Share2 size={24} strokeWidth={1.6} />
            </span>
          ) : (
            <img
              className="connect-avatar"
              src={`https://q.qlogo.cn/headimg_dl?dst_uin=${bot.botQq}&spec=160`}
              alt={name}
              draggable={false}
              onError={() => setAvatarFailed(true)}
            />
          )}
          <div className="connect-card-id">
            <p className="connect-name">{name}</p>
            <p className="connect-qq">QQ {bot.botQq}</p>
          </div>
          <span className={`connect-status is-${bot.status}`}>
            {bot.status === "online" ? <Wifi size={12} /> : <WifiOff size={12} />}
            {STATUS_LABEL[bot.status]}
          </span>
        </div>
        {bot.stepLabel && <p className="connect-step">{bot.stepLabel}</p>}
        {bot.lastError && <p className="connect-error">{bot.lastError}</p>}
        <div className="connect-card-actions">
          {bot.status === "idle" ? (
            <Button variant="primary" size="sm" onClick={onLogin}>
              <Play size={13} />
              登录
            </Button>
          ) : bot.status === "online" ? (
            <Button variant="soft" size="sm" loading={busy === `stop:${bot.id}`} onClick={onStop}>
              <Square size={13} />
              下线
            </Button>
          ) : (
            <>
              <Button variant="soft" size="sm" onClick={onQr}>
                <QrCode size={13} />
                查看进度
              </Button>
              <Button variant="ghost" size="sm" loading={busy === `stop:${bot.id}`} onClick={onStop}>
                取消登录
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="connect-delete"
            loading={busy === `remove:${bot.id}`}
            onClick={onDelete}
            aria-label="删除"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * 登录/扫码面板:点击登录立刻打开,轮询后端步骤进度,
 * 走到抓取二维码那一步就把二维码显示出来。
 */
function ConnectLoginPanel({
  bot,
  onClose,
}: {
  bot: ConnectBot;
  onClose: () => void;
}) {
  const [res, setRes] = useState<ConnectProgressRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const started = useRef(false);

  // 点到"登录"就触发一次拉起;已在跑/等扫码的 bot 只做轮询
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (bot.status !== "idle") return;
    api.post(`/connect/bots/${bot.id}/login`).catch((e) => {
      setError(e instanceof ApiRequestError ? e.body.error : "登录请求发送失败");
    });
  }, [bot.id, bot.status]);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const next = await api.get<ConnectProgressRes>(`/connect/bots/${bot.id}/progress`);
        if (!alive) return;
        setRes(next);
        setError(null);
        // 出错或已上线就停止轮询,其余情况持续跟进
        const settledBad = next.progress.settled && !!next.progress.error;
        const finished = next.qr.phase === "online";
        if (!settledBad && !finished) {
          timer = setTimeout(() => void tick(), PROGRESS_POLL_MS);
        }
      } catch (e) {
        if (!alive) return;
        setError(e instanceof ApiRequestError ? e.body.error : "无法获取登录进度");
        timer = setTimeout(() => void tick(), PROGRESS_POLL_MS * 2);
      }
    };

    void tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [bot.id]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  const cancel = async () => {
    setStopping(true);
    try {
      await api.post(`/connect/bots/${bot.id}/stop`);
    } catch {
      /* 取消失败也要关闭面板,列表刷新会纠正状态 */
    } finally {
      setStopping(false);
      onClose();
    }
  };

  const steps: ConnectProgressStep[] = res?.progress.steps ?? [];
  const qr = res?.qr;
  const failed = res?.progress.error ?? error;
  const online = qr?.phase === "online";
  const remaining =
    res?.deadline && res.deadline > now ? Math.ceil((res.deadline - now) / 1000) : null;

  const title = online ? "登录成功" : failed ? "登录失败" : `正在登录 ${bot.botQq}`;
  const subtitle = online
    ? "bot 已通过反向连接接入,可以关闭此窗口。"
    : failed
      ? "拉起过程中出错,下面是失败原因;可关闭窗口后重试。"
      : "正在按步骤拉起容器,首次登录需要先拉取镜像,可能要几分钟。";

  return (
    <div className="dialog-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="connect-qr-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold" style={{ color: "var(--fg)" }}>
          {title}
        </h3>
        <p className="connect-qr-hint">{subtitle}</p>

        <ol className="connect-steps">
          {steps.length === 0 && (
            <li className="connect-step-row is-active">
              <Loader2 size={13} className="connect-spin" />
              <span className="connect-step-label">正在获取进度…</span>
            </li>
          )}
          {steps.map((step) => (
            <li key={step.id} className={`connect-step-row is-${step.state}`}>
              <StepIcon state={step.state} />
              <span className="connect-step-label">{step.label}</span>
              {step.detail && <span className="connect-step-detail">{step.detail}</span>}
            </li>
          ))}
        </ol>

        {failed && (
          <p className="connect-qr-error">
            <AlertCircle size={13} />
            {failed}
          </p>
        )}

        <div className="connect-qr-body">
          {online ? (
            <Empty icon={Wifi} title="已登录" hint="bot 已通过反向连接接入。" />
          ) : qr?.phase === "awaiting_scan" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="connect-qr-image" src={qr.image} alt="登录二维码" />
          ) : failed ? (
            <Empty
              icon={AlertCircle}
              title="未能完成登录"
              hint="原因见上方步骤与错误提示,关闭后可以重新点击登录。"
            />
          ) : qr?.phase === "unavailable" ? (
            <Empty
              icon={Loader2}
              title="正在等待二维码出现"
              hint={qr.error}
            />
          ) : (
            <Spinner />
          )}
        </div>

        <p className="connect-qr-time">
          {remaining != null
            ? `剩余扫码时间 ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
            : qr?.phase === "awaiting_scan"
              ? `截图时间 ${new Date(qr.capturedAt).toLocaleTimeString("zh-CN")}`
              : " "}
        </p>

        <div className="flex justify-end gap-2">
          {!online && (
            <Button variant="ghost" size="md" loading={stopping} onClick={() => void cancel()}>
              取消登录
            </Button>
          )}
          <Button variant="soft" size="md" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ state }: { state: ConnectProgressStep["state"] }) {
  if (state === "done") return <Check size={13} className="connect-step-done" />;
  if (state === "error") return <X size={13} className="connect-step-error" />;
  if (state === "active") return <Loader2 size={13} className="connect-spin connect-step-active" />;
  return <Circle size={9} className="connect-step-pending" />;
}
