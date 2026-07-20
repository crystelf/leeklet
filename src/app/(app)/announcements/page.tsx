"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type {
  AnnouncementListRes,
  AnnouncementDetailRes,
  AnnouncementCommentReq,
  AnnouncementCommentRes,
  Announcement,
  AnnouncementComment,
} from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shell/page-header";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/use-fetch";
import { isStaff, formatRelative, formatMs } from "@/lib/format";
import "./announcements.css";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const staff = isStaff(user?.role);
  const { data, loading, error, reload } = useFetch<AnnouncementListRes>("/announcements");
  const [detailId, setDetailId] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        icon={<Megaphone size={22} />}
        title="公告"
        subtitle="查看最新公告与动态"
        actions={
          staff ? (
            <Link href="/announcements/manage">
              <Button size="sm" variant="soft">
                <Edit size={14} /> 管理
              </Button>
            </Link>
          ) : undefined
        }
      />

      {loading ? (
        <div className="ann-loading"><Spinner /></div>
      ) : error ? (
        <Card soft><CardBody><p className="ann-error">{error}</p></CardBody></Card>
      ) : data && data.announcements.length > 0 ? (
        <ul className="ann-list stagger">
          {data.announcements.map((a) => (
            <li key={a.id}>
              <Card className="ann-card" onClick={() => setDetailId(a.id)}>
                <CardBody>
                  <AnnouncementCardHead ann={a} />
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon={Megaphone} title="暂无公告" hint="还没有发布任何公告。" />
      )}

      <AnnouncementDetail
        id={detailId}
        onClose={() => setDetailId(null)}
        onChanged={() => void reload()}
      />
    </>
  );
}

function authorBadge(role: Announcement["authorRole"]) {
  return (
    <Badge variant={role === "admin" ? "admin" : "internal"}>
      {role === "admin" ? "admin" : "staff"}
    </Badge>
  );
}

function AnnouncementCardHead({ ann }: { ann: Announcement }) {
  const display = ann.authorNickname?.trim() || `QQ ${ann.authorQq}`;
  return (
    <>
      <div className="ann-card-head">
        <h3 className="ann-card-title">{ann.title}</h3>
        <span className="ann-card-time">{formatRelative(ann.createdAt)}</span>
      </div>
      <div className="ann-card-author">
        <img
          className="ann-avatar-sm"
          src={`https://q.qlogo.cn/headimg_dl?dst_uin=${ann.authorQq}&spec=100`}
          alt={display}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
        <span className="ann-author-name">{display}</span>
        {authorBadge(ann.authorRole)}
      </div>
      <p className="ann-card-excerpt">{excerpt(ann.content)}</p>
    </>
  );
}

function excerpt(md: string): string {
  const text = md
    .replace(/[#*`>\-_\[\]!()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 80 ? text.slice(0, 80) + "…" : text || "(无预览)";
}

function AnnouncementDetail({
  id,
  onClose,
  onChanged,
}: {
  id: number | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch<AnnouncementDetailRes>(
    id ? `/announcements/${id}` : null,
    [id],
  );
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submitComment = async () => {
    if (!id) return;
    if (!comment.trim()) {
      toast.error("请填写评论");
      return;
    }
    setBusy(true);
    try {
      await api.post<AnnouncementCommentRes>(
        `/announcements/${id}/comments`,
        { content: comment.trim() } satisfies AnnouncementCommentReq,
      );
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

  return (
    <Modal
      open={!!id}
      title={data ? data.announcement.title : "公告详情"}
      confirmText="关闭"
      onConfirm={onClose}
      onClose={onClose}
    >
      {loading ? (
        <div className="ann-loading"><Spinner /></div>
      ) : error ? (
        <p className="ann-error">{error}</p>
      ) : data ? (
        <div className="ann-detail">
          <div className="ann-detail-author">
            <img
              className="ann-avatar-sm"
              src={`https://q.qlogo.cn/headimg_dl?dst_uin=${data.announcement.authorQq}&spec=100`}
              alt=""
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
            <span className="ann-author-name">
              {data.announcement.authorNickname?.trim() || `QQ ${data.announcement.authorQq}`}
            </span>
            {authorBadge(data.announcement.authorRole)}
            <span className="ann-detail-time">{formatMs(data.announcement.createdAt)}</span>
          </div>
          <div className="md-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.announcement.content}
            </ReactMarkdown>
          </div>

          <h4 className="ann-comments-title">评论 ({data.comments.length})</h4>
          {data.comments.length > 0 ? (
            <ul className="ann-comments">
              {data.comments.map((c) => (
                <CommentItem key={c.id} c={c} />
              ))}
            </ul>
          ) : (
            <p className="ann-comments-empty">还没有评论</p>
          )}

          <div className="ann-comment-form">
            <Textarea
              placeholder="发表评论…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              size="sm"
              loading={busy}
              onClick={() => void submitComment()}
              disabled={!comment.trim()}
            >
              发表
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function CommentItem({ c }: { c: AnnouncementComment }) {
  const display = c.authorNickname?.trim() || `QQ ${c.authorQq}`;
  return (
    <li className="ann-comment">
      <img
        className="ann-avatar-sm"
        src={`https://q.qlogo.cn/headimg_dl?dst_uin=${c.authorQq}&spec=100`}
        alt={display}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <div className="ann-comment-body">
        <div className="ann-comment-head">
          <span className="ann-comment-name">{display}</span>
          {c.isStaff && authorBadge(c.authorRole)}
          <span className="ann-comment-time">{formatRelative(c.createdAt)}</span>
        </div>
        <p className="ann-comment-text">{c.content}</p>
      </div>
    </li>
  );
}
