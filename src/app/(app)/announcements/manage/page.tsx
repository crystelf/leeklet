"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus, Eye, Trash2, Edit, CalendarClock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type {
  AnnouncementManageListRes,
  Announcement,
  CreateAnnouncementReq,
  UpdateAnnouncementReq,
  AnnouncementIdRes,
  AnnouncementStatus,
} from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import { isStaff, formatRelative, formatMs } from "@/lib/format";
import "../announcements.css";

export default function AnnouncementsManagePage() {
  const { user } = useAuth();
  const staff = isStaff(user?.role);
  const { data, loading, error, reload } = useFetch<AnnouncementManageListRes>(
    "/announcements/manage",
  );
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Announcement | null>(null);

  if (!staff) {
    return (
      <>
        <PageHeader icon={<Megaphone size={22} />} title="公告管理" />
        <Card soft>
          <CardBody>
            <Empty icon={Megaphone} title="仅内部成员可访问" hint="此页面用于管理公告。" />
          </CardBody>
        </Card>
      </>
    );
  }

  const openNew = () => {
    setEditTarget(null);
    setEditOpen(true);
  };
  const openEdit = (a: Announcement) => {
    setEditTarget(a);
    setEditOpen(true);
  };

  return (
    <>
      <PageHeader
        icon={<Megaphone size={22} />}
        title="公告管理"
        subtitle="发布、编辑与管理公告"
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus size={14} /> 新建
          </Button>
        }
      />

      {loading ? (
        <div className="ann-loading"><Spinner /></div>
      ) : error ? (
        <Card soft><CardBody><p className="ann-error">{error}</p></CardBody></Card>
      ) : data && data.announcements.length > 0 ? (
        <ul className="ann-manage-list stagger">
          {data.announcements.map((a) => (
            <ManageRow
              key={a.id}
              ann={a}
              onView={() => setViewTarget(a)}
              onEdit={() => openEdit(a)}
              onChanged={() => void reload()}
            />
          ))}
        </ul>
      ) : (
        <Empty
          icon={Megaphone}
          title="暂无公告"
          hint="点「新建」发布第一条公告。"
          action={
            <Button size="sm" onClick={openNew}>
              <Plus size={14} /> 新建
            </Button>
          }
        />
      )}

      <EditModal
        open={editOpen}
        target={editTarget}
        onClose={() => setEditOpen(false)}
        onDone={() => {
          setEditOpen(false);
          void reload();
        }}
      />
      <ViewModal target={viewTarget} onClose={() => setViewTarget(null)} />
    </>
  );
}

function statusBadge(s: AnnouncementStatus) {
  if (s === "draft") return <Badge variant="pending">草稿</Badge>;
  if (s === "archived") return <Badge variant="closed">归档</Badge>;
  return <Badge variant="ok">已发布</Badge>;
}

function ManageRow({
  ann,
  onView,
  onEdit,
  onChanged,
}: {
  ann: Announcement;
  onView: () => void;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const toggleVisible = async () => {
    setBusy(true);
    try {
      await api.post(`/announcements/${ann.id}/visible`, { visible: !ann.visible });
      toast.success(ann.visible ? "已隐藏" : "已显示");
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`确认删除公告「${ann.title}」？`)) return;
    setBusy(true);
    try {
      await api.delete(`/announcements/${ann.id}`);
      toast.success("已删除");
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "删除失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li>
      <Card>
        <CardBody className="ann-manage-row">
          <div className="ann-manage-head">
            <div className="ann-manage-title-wrap">
              <h3 className="ann-manage-title">{ann.title}</h3>
              <div className="ann-manage-badges">
                {statusBadge(ann.status)}
                {!ann.visible && <Badge variant="closed">隐藏</Badge>}
                {ann.scheduledAt && (
                  <Badge variant="warn">定时 {formatMs(ann.scheduledAt)}</Badge>
                )}
              </div>
            </div>
            <span className="ann-manage-time">{formatRelative(ann.createdAt)}</span>
          </div>
          <p className="ann-manage-excerpt">{excerpt(ann.content)}</p>
          <div className="ann-manage-actions">
            <Button size="sm" variant="soft" onClick={onView}>
              <Eye size={13} /> 查看
            </Button>
            <Button size="sm" variant="soft" onClick={onEdit}>
              <Edit size={13} /> 编辑
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void toggleVisible()} loading={busy}>
              <CalendarClock size={13} /> {ann.visible ? "隐藏" : "显示"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void remove()} disabled={busy}>
              <Trash2 size={13} /> 删除
            </Button>
          </div>
        </CardBody>
      </Card>
    </li>
  );
}

function excerpt(md: string): string {
  const text = md
    .replace(/[#*`>\-_\[\]!()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 100 ? text.slice(0, 100) + "…" : text || "(无预览)";
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

function EditModal({
  open,
  target,
  onClose,
  onDone,
}: {
  open: boolean;
  target: Announcement | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<AnnouncementStatus>("published");
  const [visible, setVisible] = useState(true);
  const [scheduled, setScheduled] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(target?.title ?? "");
      setContent(target?.content ?? "");
      setStatus(target?.status ?? "published");
      setVisible(target?.visible ?? true);
      setScheduled(target?.scheduledAt ? toLocalInput(target.scheduledAt) : "");
      setShowPreview(false);
    }
  }, [open, target]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("请填写标题");
      return;
    }
    if (!content.trim()) {
      toast.error("请填写内容");
      return;
    }
    setBusy(true);
    try {
      const scheduledAt = scheduled ? fromLocalInput(scheduled) : null;
      const payload = { title: title.trim(), content, status, visible, scheduledAt };
      if (target) {
        await api.patch<AnnouncementIdRes>(
          `/announcements/${target.id}`,
          payload satisfies UpdateAnnouncementReq,
        );
        toast.success("已更新");
      } else {
        await api.post<AnnouncementIdRes>(
          "/announcements",
          payload satisfies CreateAnnouncementReq,
        );
        toast.success("已发布");
      }
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
      title={target ? "编辑公告" : "新建公告"}
      onClose={onClose}
      onConfirm={() => void submit()}
      confirmText={target ? "保存" : "发布"}
      busy={busy}
    >
      <div className="ann-edit-form">
        <Input
          label="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="公告标题"
        />
        <div>
          <label className="field-label">内容（支持 Markdown）</label>
          <div className="tab-bar ann-edit-tabs">
            <button
              type="button"
              className="tab"
              data-active={!showPreview}
              onClick={() => setShowPreview(false)}
            >
              编辑
            </button>
            <button
              type="button"
              className="tab"
              data-active={showPreview}
              onClick={() => setShowPreview(true)}
            >
              预览
            </button>
          </div>
          {showPreview ? (
            <div className="md-body ann-edit-preview">
              {content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <span className="ann-empty-hint">暂无内容</span>
              )}
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="支持 Markdown 语法…"
              className="ann-edit-textarea"
            />
          )}
        </div>
        <div className="ann-edit-row">
          <Select
            label="状态"
            value={status}
            onChange={(e) => setStatus(e.target.value as AnnouncementStatus)}
          >
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">归档</option>
          </Select>
          <div>
            <label className="field-label">定时发布（留空立即）</label>
            <input
              type="datetime-local"
              className="ann-dt-input"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
            />
          </div>
        </div>
        <label className="ann-edit-visible">
          <Switch checked={visible} onChange={setVisible} />
          <span>显示给用户（关闭则隐藏）</span>
        </label>
        {scheduled && (
          <p className="input-hint">
            定时发布：到时间后自动转为已发布。设了未来时间时，状态会自动存为草稿等待到期。
          </p>
        )}
      </div>
    </Modal>
  );
}

function ViewModal({
  target,
  onClose,
}: {
  target: Announcement | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!target}
      title={target?.title ?? "公告"}
      confirmText="关闭"
      onConfirm={onClose}
      onClose={onClose}
    >
      {target && (
        <div className="ann-detail">
          <div className="ann-detail-author">
            <img
              className="ann-avatar-sm"
              src={`https://q.qlogo.cn/headimg_dl?dst_uin=${target.authorQq}&spec=100`}
              alt=""
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
            <span className="ann-author-name">
              {target.authorNickname?.trim() || `QQ ${target.authorQq}`}
            </span>
            <Badge variant={target.authorRole === "admin" ? "admin" : "internal"}>
              {target.authorRole === "admin" ? "admin" : "staff"}
            </Badge>
            <span className="ann-detail-time">{formatMs(target.createdAt)}</span>
          </div>
          <div className="md-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{target.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </Modal>
  );
}
