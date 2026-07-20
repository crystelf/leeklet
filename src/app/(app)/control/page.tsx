"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  Bot,
  Cpu,
  ToggleRight,
  Power,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type {
  GroupsManagedRes,
  GroupDetailRes,
  FeaturesAccessHooksRes,
  AiControlState,
  AiField,
  SkillsListRes,
  GroupSkillsState,
} from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import { hasRole } from "@/lib/format";
import "./control.css";

const AI_FIELDS: { field: AiField; label: string; hint: string }[] = [
  { field: "emoji", label: "表情包", hint: "AI 表情包系统" },
  { field: "expression", label: "表达学习", hint: "学习群内表达风格" },
  { field: "retention", label: "数据清理", hint: "自动清理过期数据" },
  { field: "memory", label: "记忆检索", hint: "长期记忆调用" },
  { field: "topic", label: "话题跟踪", hint: "跟踪群内话题" },
  { field: "planner", label: "动作规划", hint: "动作规划器" },
  { field: "audio", label: "语音消息", hint: "AI 发语音" },
  { field: "searxng", label: "网页搜索", hint: "SearXNG 搜索" },
  { field: "webReader", label: "网页阅读", hint: "读取网页内容" },
  { field: "dynamicDelay", label: "动态延迟", hint: "模拟人类回复节奏" },
  {
    field: "enableMarkdownScreenshot",
    label: "Markdown 截图",
    hint: "长消息截图渲染",
  },
  { field: "enableMediaRecognition", label: "媒体识别", hint: "识别图片/视频" },
];

export default function ControlPage() {
  return (
    <Suspense
      fallback={
        <div className="control-loading">
          <Spinner />
        </div>
      }
    >
      <ControlPageInner />
    </Suspense>
  );
}

function ControlPageInner() {
  const { user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const { data: allManaged } = useFetch<GroupsManagedRes>(
    user ? `/groups/managed?qq=${user.qq}` : null,
  );
  const managed = useMemo(
    () => allManaged?.filter((g) => g.claimed) ?? [],
    [allManaged],
  );

  const initialGroup = params.get("groupId");
  const [selected, setSelected] = useState<number | null>(
    initialGroup ? Number(initialGroup) : null,
  );

  useEffect(() => {
    if (!selected && managed.length) {
      setSelected(managed[0]?.groupId ?? null);
    }
  }, [managed, selected]);

  const selectedGroup = useMemo(
    () => managed.find((g) => g.groupId === selected) ?? null,
    [managed, selected],
  );

  return (
    <>
      <PageHeader
        icon={<SlidersHorizontal size={22} />}
        title="功能控制"
        subtitle="管理群里的 Bot 指令与 AI 开关"
      />

      <Card className="mb-5">
        <CardBody>
          <label className="field-label">选择群</label>
          {managed?.length ? (
            <div className="control-group-select">
              {managed.map((g) => (
                <button
                  key={g.groupId}
                  type="button"
                  className={`control-group-chip ${selected === g.groupId ? "control-group-chip-active" : ""}`}
                  onClick={() => {
                    setSelected(g.groupId);
                    router.replace(`/control?groupId=${g.groupId}`, {
                      scroll: false,
                    });
                  }}
                >
                  <img
                    src={g.groupAvatar}
                    alt=""
                    className="control-chip-avatar"
                    onError={(e) =>
                      ((e.currentTarget as HTMLImageElement).style.visibility =
                        "hidden")
                    }
                  />
                  <span className="control-chip-name">
                    {g.groupName || g.groupId}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              暂无可管理的群，请先到{" "}
              <a href="/groups" style={{ color: "var(--accent)" }}>
                群管理
              </a>{" "}
              认领。
            </p>
          )}
        </CardBody>
      </Card>

      {selectedGroup && selected ? (
        <div className="control-sections stagger">
          <BotSection groupId={selected} initial={selectedGroup.botEnabled} />
          <AccessHookSection groupId={selected} />
          <AiControlSection groupId={selected} />
          <SkillSection groupId={selected} />
        </div>
      ) : managed?.length === 0 ? (
        <Empty
          icon={SlidersHorizontal}
          title="没有可控制的群"
          hint="认领群后即可在此管理 bot 与 AI 开关"
        />
      ) : null}
    </>
  );
}

function BotSection({
  groupId,
  initial,
}: {
  groupId: number;
  initial: boolean;
}) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async (v: boolean) => {
    setEnabled(v);
    setBusy(true);
    try {
      await api.post("/bot-control/enabled", { groupId, enabled: v });
      toast.success(v ? "Bot 已在该群启用" : "Bot 已在该群关闭");
    } catch (e) {
      setEnabled(!v);
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardBody>
        <div className="control-section-head">
          <span className="control-section-icon">
            <Bot size={18} />
          </span>
          <div>
            <h3 className="control-section-title">Bot 总开关</h3>
            <p className="control-section-sub">
              关闭后 bot 不再响应该群任何消息
            </p>
          </div>
          <Switch
            checked={enabled}
            disabled={busy}
            onChange={toggle}
            ariaLabel="Bot 总开关"
          />
        </div>
      </CardBody>
    </Card>
  );
}

function AccessHookSection({ groupId }: { groupId: number }) {
  const { data: hooksRes, loading } = useFetch<FeaturesAccessHooksRes>(
    "/features/access-hooks",
  );
  const { data: detail } = useFetch<GroupDetailRes>(
    `/groups/detail?groupId=${groupId}`,
    [groupId],
  );
  const toast = useToast();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const overrides = useMemo(() => {
    const map = new Map<string, "allow" | "block">();
    detail?.accessHooks.forEach((h) =>
      map.set(`${h.plugin}:${h.hookId}`, h.action),
    );
    return map;
  }, [detail]);

  const toggle = async (
    plugin: string,
    hookId: string,
    current: "allow" | "block" | undefined,
  ) => {
    const action = current === "block" ? "allow" : "block";
    const key = `${plugin}:${hookId}`;
    setBusyKey(key);
    try {
      await api.post("/bot-control/access-hook", {
        groupId,
        plugin,
        hookId,
        action,
      });
      toast.success(
        action === "block" ? `已屏蔽 ${hookId}` : `已放行 ${hookId}`,
      );
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Card className="mb-4">
      <CardBody>
        <div className="control-section-head">
          <span className="control-section-icon">
            <ToggleRight size={18} />
          </span>
          <div>
            <h3 className="control-section-title">指令开关</h3>
            <p className="control-section-sub">
              屏蔽或放行某插件某指令在本群的执行
            </p>
          </div>
        </div>

        {loading ? (
          <div className="control-loading">
            <Spinner />
          </div>
        ) : hooksRes?.plugins.length ? (
          <div className="control-hooks-list">
            {hooksRes.plugins.map((p) => (
              <details key={p.plugin} className="control-plugin-group">
                <summary className="control-plugin-summary">
                  <ChevronDown size={14} className="control-chevron" />
                  <span className="control-plugin-name">{p.plugin}</span>
                  <Badge variant="pending">{p.hooks.length}</Badge>
                </summary>
                <div className="control-hooks">
                  {p.hooks.map((h) => {
                    const key = `${p.plugin}:${h.id}`;
                    const action = overrides.get(key);
                    const blocked = action === "block";
                    return (
                      <div key={h.id} className="control-hook-row">
                        <div className="control-hook-info">
                          <span className="control-hook-id">{h.id}</span>
                          {h.description && (
                            <span className="control-hook-desc">
                              {h.description}
                            </span>
                          )}
                        </div>
                        <Switch
                          checked={!blocked}
                          disabled={busyKey === key}
                          onChange={() => void toggle(p.plugin, h.id, action)}
                          ariaLabel={`${h.id} 开关`}
                        />
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <Empty
            icon={ToggleRight}
            title="暂无指令"
            hint="没有插件注册 access hook"
          />
        )}
      </CardBody>
    </Card>
  );
}

function AiControlSection({ groupId }: { groupId: number }) {
  const { user } = useAuth();
  const toast = useToast();
  const {
    data: state,
    loading,
    reload,
  } = useFetch<AiControlState>(`/ai-control/state?groupId=${groupId}`, [
    groupId,
  ]);
  const [busyField, setBusyField] = useState<string | null>(null);

  const canEdit = hasRole(user?.role, "member");

  const toggle = async (field: AiField, current: boolean) => {
    if (!canEdit) {
      toast.error("修改 AI 控制需要会员及以上身份");
      return;
    }
    const next = !current;
    setBusyField(field);
    try {
      await api.post("/ai-control", { groupId, field, value: next });
      toast.success(`${field} 已切换`);
      void reload();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusyField(null);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="control-section-head">
          <span className="control-section-icon">
            <Cpu size={18} />
          </span>
          <div>
            <h3 className="control-section-title">AI 控制</h3>
            <p className="control-section-sub">
              {canEdit
                ? "覆盖该群 AI 功能开关"
                : "仅查看，修改需会员及以上身份"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="control-loading">
            <Spinner />
          </div>
        ) : (
          <div className="control-ai-grid">
            {AI_FIELDS.map((f) => {
              const v = !!state?.[f.field];
              return (
                <div key={f.field} className="control-ai-row">
                  <div className="control-ai-info">
                    <span className="control-ai-label">{f.label}</span>
                    <span className="control-ai-hint">{f.hint}</span>
                  </div>
                  <Switch
                    checked={v}
                    disabled={!canEdit || busyField === f.field}
                    onChange={() => void toggle(f.field, v)}
                    ariaLabel={f.label}
                  />
                </div>
              );
            })}
          </div>
        )}
        <p className="control-ai-note">
          <Power size={11} /> 未覆盖的字段使用全局默认值
        </p>
      </CardBody>
    </Card>
  );
}

function SkillSection({ groupId }: { groupId: number }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: skills, loading: skillsLoading } =
    useFetch<SkillsListRes>("/ai-control/skills");
  const {
    data: skillState,
    loading: stateLoading,
    reload,
  } = useFetch<GroupSkillsState>(
    `/ai-control/skills/state?groupId=${groupId}`,
    [groupId],
  );

  const canEdit = hasRole(user?.role, "member");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    if (!skills || !skillState) return;
    const effective =
      skillState.groupAllowed.length > 0
        ? skillState.groupAllowed
        : skills.map((s) => s.name);
    setSelected(new Set(effective));
  }, [skillState, skills]);

  const toggleSkill = async (name: string) => {
    if (!canEdit) {
      toast.error("修改 AI Skill 需要会员及以上身份");
      return;
    }
    const prev = selected;
    const next = new Set(prev);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);

    setBusyKey(name);
    const allChecked = skills && next.size === skills.length;
    const payload = allChecked ? null : Array.from(next);
    try {
      await api.post("/ai-control/skills", {
        groupId,
        allowedExternalSkills: payload,
      });
      toast.success(prev.has(name) ? `已禁用 ${name}` : `已启用 ${name}`);
      void reload();
    } catch (e) {
      setSelected(prev);
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusyKey(null);
    }
  };

  const allOn = skills ? selected.size === skills.length : false;

  return (
    <Card className="mb-4">
      <CardBody>
        <div className="control-section-head">
          <span className="control-section-icon">
            <Sparkles size={18} />
          </span>
          <div>
            <h3 className="control-section-title">AI Skills 技能</h3>
            <p className="control-section-sub">
              {canEdit
                ? `勾选本群允许的 AI Skill${allOn ? " · 当前全部启用" : ""}`
                : "仅查看，修改需会员及以上身份"}
            </p>
          </div>
        </div>

        {stateLoading || skillsLoading ? (
          <div className="control-loading">
            <Spinner />
          </div>
        ) : !skills || skills.length === 0 ? (
          <Empty
            icon={Sparkles}
            title="暂无可用 Skill"
            hint="没有插件注册外部 AI Skill"
          />
        ) : (
          <div className="control-ai-grid">
            {skills.map((s) => {
              const checked = selected.has(s.name);
              return (
                <div key={s.name} className="control-ai-row">
                  <div className="control-ai-info">
                    <span className="control-ai-label">{s.name}</span>
                    <span className="control-ai-hint">{s.description}</span>
                  </div>
                  <Switch
                    checked={checked}
                    disabled={!canEdit || busyKey === s.name}
                    onChange={() => void toggleSkill(s.name)}
                    ariaLabel={s.name}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
