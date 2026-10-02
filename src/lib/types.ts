export type Role = "normal" | "member" | "internal" | "admin";

export interface ApiError {
  ok: false;
  error: string;
}

export interface AuthExchangeKeyReq {
  key: string;
}
export interface AuthLoginReq {
  account: string;
  password: string;
}
export interface AuthRegisterReq {
  qq: number;
  key: string;
  password: string;
  email?: string;
}
export interface AuthChangePasswordReq {
  key: string;
  newPassword: string;
}
export interface AuthRes {
  ok: true;
  qq: number;
  expiresAt: number;
}

export interface UserMe {
  ok: true;
  id: number;
  qq: number;
  nickname?: string | null;
  email: string | null;
  role: Role;
  memberUntil: number | null;
  registered: boolean;
}

export type FeedbackStatus = "open" | "resolved" | "closed" | "reopened";

export interface FeedbackAttachmentRef {
  id: number;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}

export interface Feedback {
  id: number;
  userQq: number;
  userNickname: string | null;
  content: string;
  images: string[];
  attachments: FeedbackAttachmentRef[];
  status: FeedbackStatus;
  createdAt: number;
  updatedAt: number;
}
export interface FeedbackCreateReq {
  content: string;
  attachmentIds?: number[];
}

export interface FeedbackCommentReq {
  feedbackId: number;
  content: string;
  attachmentIds?: number[];
}

export interface FeedbackAvatarUrl {
  qq: number;
  url: string;
}

export interface FeedbackUploadRes {
  ok: true;
  id: number;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}


export interface FeedbackUploadRes {
  ok: true;
  id: number;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}
export interface FeedbackListRes {
  ok: true;
  feedback: Feedback[];
}
export interface FeedbackComment {
  id: number;
  feedbackId: number;
  authorQq: number;
  authorRole: Role;
  nickname: string | null;
  content: string;
  attachments: FeedbackAttachmentRef[];
  isStaff: boolean;
  createdAt: number;
}

export type FeedbackEventAction = "status_change";

export interface FeedbackEvent {
  id: number;
  feedbackId: number;
  actorQq: number;
  actorNickname: string | null;
  actorRole: Role;
  action: FeedbackEventAction;
  fromStatus: FeedbackStatus | null;
  toStatus: FeedbackStatus | null;
  createdAt: number;
}

export interface FeedbackDetailRes {
  ok: true;
  feedback: Feedback;
  comments: FeedbackComment[];
  events: FeedbackEvent[];
}
export interface FeedbackCommentReq {
  content: string;
}
export interface FeedbackStatusReq {
  status: FeedbackStatus;
}

export interface AdminListRes {
  ok: true;
  internals: number[];
  admins: number[];
}
export interface AdminModifyReq {
  qq: number;
  add: boolean;
}
export interface AdminModifyRes {
  ok: true;
  qq: number;
  added: boolean;
  internals?: number[];
  admins?: number[];
}

// ===== 机器人状态 =====
export interface BotStatus {
  adapter: string;
  botId: string;
  qq: number;
  nickname: string | null;
  online: boolean;
  connectedAt: number | null;
}
export interface BotsRes {
  ok: true;
  bots: BotStatus[];
  total: number;
  online: number;
}

// ===== 公告 =====
export type AnnouncementStatus = "draft" | "published" | "archived";

export interface Announcement {
  id: number;
  title: string;
  content: string;
  status: AnnouncementStatus;
  visible: boolean;
  authorQq: number;
  authorRole: Role;
  authorNickname: string | null;
  scheduledAt: number | null;
  createdAt: number;
  updatedAt: number;
}
export interface AnnouncementComment {
  id: number;
  announcementId: number;
  authorQq: number;
  authorRole: Role;
  authorNickname: string | null;
  content: string;
  isStaff: boolean;
  createdAt: number;
}
export interface AnnouncementListRes {
  ok: true;
  announcements: Announcement[];
}
export type AnnouncementUnreadRes = AnnouncementListRes;
export type AnnouncementManageListRes = AnnouncementListRes;
export interface AnnouncementDetailRes {
  ok: true;
  announcement: Announcement;
  comments: AnnouncementComment[];
}
export interface AnnouncementCommentsRes {
  ok: true;
  comments: AnnouncementComment[];
}
export interface AnnouncementOkRes { ok: true }
export interface AnnouncementCommentRes { ok: true; commentId: number }
export interface AnnouncementIdRes { ok: true; id: number }
export interface AnnouncementVisibleRes { ok: true; id: number; visible: boolean }
export interface CreateAnnouncementReq {
  title: string;
  content: string;
  status?: AnnouncementStatus;
  visible?: boolean;
  scheduledAt?: number | null;
}
export interface UpdateAnnouncementReq {
  title?: string;
  content?: string;
  status?: AnnouncementStatus;
  visible?: boolean;
  scheduledAt?: number | null;
}
export interface SetAnnouncementVisibleReq {
  visible: boolean;
}
export interface AnnouncementCommentReq {
  content: string;
}

export type ApiResult<T> = T | ApiError;
