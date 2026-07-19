"use client";

import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Reply,
  Images,
  RefreshCw,
  MessagesSquare,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type {
  FeedbackListRes,
  FeedbackDetailRes,
  Feedback,
  FeedbackStatus,
} from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import { isAdmin, isStaff, formatRelative } from "@/lib/format";
import "./feedback.css";
import "./feedback.css";

export default function FeedbackPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [viewAll, setViewAll] = useState(false);

  const minePath = viewAll && admin ? "/feedback/all" : "/feedback/mine";
  const { data, loading, error, reload } = useFetch<FeedbackListRes>(minePath, [viewAll]);

  return (
    <>
      <PageHeader
        icon={<MessageSquare size={22} />}
        title="反馈中心"
        subtitle="提交问题与建议，跟踪处理进度"
        actions={
          <Button size="sm" onClick={() => setSubmitOpen(true)}>
            <Plus size={14} /> 提交反馈
          </Button>
        }
      />

      {admin && (
        <div className="tab-bar feedback-toggle">
          <button className="tab" data-active={!viewAll} onClick={() => setViewAll(false)}>
            我的反馈
          </button>
          <button className="tab" data-active={viewAll} onClick={() => setViewAll(true)}>
            全部反馈
          </button>
        </div>
      )}

      {loading ? (
        <div className="feedback-loading"><Spinner /></div>
      ) : error ? (
        <Card soft><CardBody><p className="feedback-error">{error}</p></CardBody></Card>
      ) : data?.feedback.length ? (
        <div className="feedback-list stagger">
          {data.feedback.map((fb) => (
            <FeedbackRow key={fb.id} feedback={fb} onOpen={() => setDetailId(fb.id)} />
          ))}
        </div>
      ) : (
        <Empty
          icon={MessageSquare}
          title="还没有反馈"
          hint="发现问题或有想法？提交一条反馈，我们会认真处理。"
          action={<Button size="sm" onClick={() => setSubmitOpen(true)}><Plus size={14} /> 写第一条</Button>}
        />
      )}

      <SubmitDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onDone={() => {
          setSubmitOpen(false);
          void reload();
        }}
      />

      <FeedbackDetail
        id={detailId}
        onClose={() => setDetailId(null)}
        onChanged={() => void reload()}
      />
    </>
  );
}

function statusBadge(s: FeedbackStatus) {
  const map = {
    open: { v: "open", label: "开放" },
    resolved: { v: "resolved", label: "已解决" },
    closed: { v: "closed", label: "已关闭" },
    reopened: { v: "reopened", label: "已重开" },
  } as const;
  const m = map[s];
  return <Badge variant={m.v}>{m.label}</Badge>;
}

function FeedbackRow({ feedback, onOpen }: { feedback: Feedback; onOpen: () => void }) {
  return (
    <Card className="feedback-row" onClick={onOpen}>
      <CardBody className="feedback-row-body">
        <div className="feedback-row-head">
          <span className="feedback-row-id">#{feedback.id}</span>
          {statusBadge(feedback.status)}
          <span className="feedback-row-time">{formatRelative(feedback.updatedAt)}</span>
        </div>
        <p className="feedback-row-content">{feedback.content}</p>
        {feedback.images.length > 0 && (
          <p className="feedback-row-imgs">
            <Images size={12} /> {feedback.images.length} 张图片
          </p>
        )}
      </CardBody>
    </Card>
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
  const [content, setContent] = useState("");
  const [imagesText, setImagesText] = useState("");

  const submit = async () => {
    if (!content.trim()) {
      toast.error("请填写反馈内容");
      return;
    }
    setBusy(true);
    try {
      const images = imagesText
        .split(/[\n,，\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.startsWith("http"))
        .slice(0, 9);
      await api.post("/feedback", { content: content.trim(), images });
      toast.success("反馈已提交");
      setContent("");
      setImagesText("");
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
      title="提交反馈"
      description="描述你遇到的问题或建议，最多可附 9 张图片链接。"
      confirmText="提交"
      busy={busy}
      onConfirm={submit}
      onClose={onClose}
    >
      <div className="feedback-form">
        <Textarea
          label="反馈内容"
          placeholder="我发现一个 bug… 或 希望能加一个功能…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Textarea
          label="图片链接（可选）"
          placeholder="每行一个 URL，最多 9 张"
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
        />
      </div>
    </Modal>
  );
}

function FeedbackDetail({
  id,
  onClose,
  onChanged,
}: {
  id: number | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const staff = isStaff(user?.role);
  const toast = useToast();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useFetch<FeedbackDetailRes>(
    id ? `/feedback/${id}` : null,
    [id]
  );

  const addComment = async () => {
    if (!comment.trim() || !id) return;
    setBusy(true);
    try {
      await api.post(`/feedback/${id}/comment`, { content: comment.trim() });
      setComment("");
      toast.success("评论已发布");
      void reload();
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "评论失败");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status: FeedbackStatus) => {
    if (!id) return;
    setBusy(true);
    try {
      await api.post(`/feedback/${id}/status`, { status });
      toast.success("状态已更新");
      void reload();
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.body.error : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!id}
      title={data ? `反馈 #${data.feedback.id}` : "反馈详情"}
      confirmText="关闭"
      onConfirm={onClose}
      onClose={onClose}
    >
      {loading ? (
        <div className="feedback-loading"><Spinner /></div>
      ) : error ? (
        <p className="feedback-error">{error}</p>
      ) : data ? (
        <div className="feedback-detail">
          <div className="feedback-detail-head">
            {statusBadge(data.feedback.status)}
            <span className="feedback-detail-meta">
              {data.feedback.userQq} · {formatRelative(data.feedback.createdAt)}
            </span>
          </div>
          <p className="feedback-detail-content">{data.feedback.content}</p>
          {data.feedback.images.length > 0 && (
            <div className="feedback-detail-imgs">
              {data.feedback.images.map((src) => (
                <img key={src} src={src} alt="" className="feedback-detail-img" loading="lazy" />
              ))}
            </div>
          )}

          <div className="feedback-detail-actions">
            {admin && data.feedback.status !== "open" && (
              <Button size="sm" variant="soft" onClick={() => void changeStatus("open")}>
                标记开放
              </Button>
            )}
            {admin && data.feedback.status !== "resolved" && (
              <Button size="sm" variant="soft" onClick={() => void changeStatus("resolved")}>
                标记已解决
              </Button>
            )}
            {admin && data.feedback.status !== "closed" && (
              <Button size="sm" variant="outline" onClick={() => void changeStatus("closed")}>
                关闭
              </Button>
            )}
            {!admin && data.feedback.status === "closed" && (
              <Button size="sm" variant="soft" onClick={() => void changeStatus("reopened")}>
                <RefreshCw size={13} /> 重新打开
              </Button>
            )}
          </div>

          <h4 className="feedback-comments-title">
            <MessagesSquare size={14} /> 评论 ({data.comments.length})
          </h4>
          {data.comments.length > 0 ? (
            <ul className="feedback-comments">
              {data.comments.map((c) => (
                <li key={c.id} className="feedback-comment">
                  <div className="feedback-comment-head">
                    <span className="feedback-comment-author">
                      {c.authorQq}
                      {c.isStaff && <Badge variant="internal" className="ml-1.5">staff</Badge>}
                    </span>
                    <span className="feedback-comment-time">{formatRelative(c.createdAt)}</span>
                  </div>
                  <p className="feedback-comment-text">{c.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="feedback-comments-empty">还没有评论</p>
          )}

          <div className="feedback-comment-form">
            <Textarea
              placeholder={staff ? "发表评论（评论后反馈自动转为开放）" : "发表评论（反馈需为开放或重开状态）"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button size="sm" loading={busy} onClick={() => void addComment()} disabled={!comment.trim()}>
              <Reply size={13} /> 发表
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
