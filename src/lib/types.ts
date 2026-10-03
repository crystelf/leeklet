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
  /** Connect 托管的社区 bot */
  connect?: boolean;
}
export interface BotsRes {
  ok: true;
  bots: BotStatus[];
  total: number;
  online: number;
}

// ===== Connect 社区代挂 =====
export type ConnectStatus = "idle" | "starting" | "awaiting_scan" | "online";

export interface ConnectBot {
  id: number;
  ownerQq: number;
  botQq: number;
  nickname: string | null;
  status: ConnectStatus;
  /** 进行中步骤的可读文本,空闲时为 null */
  stepLabel?: string | null;
  lastError: string | null;
  createdAt: number;
  ownerRole?: string;
}

export interface ConnectQuota {
  used: number;
  max: number;
  override: number | null;
  default: number;
}

export interface ConnectBotsRes {
  ok: true;
  bots: ConnectBot[];
  quota: ConnectQuota;
}

export interface ConnectCreateRes {
  ok: true;
  id: number;
}

export type ConnectStepState = "pending" | "active" | "done" | "error";

export interface ConnectProgressStep {
  id: string;
  label: string;
  state: ConnectStepState;
  detail: string | null;
  at: number | null;
}

export interface ConnectProgress {
  botId: number;
  activeStep: string | null;
  /** 已进入终态(上线/失败/未开始) */
  settled: boolean;
  error: string | null;
  startedAt: number | null;
  updatedAt: number;
  steps: ConnectProgressStep[];
}

export type ConnectQrView =
  | { phase: "online" | "offline" }
  | { phase: "awaiting_scan"; image: string; capturedAt: number }
  | { phase: "unavailable"; error: string };

export type ConnectQrRes = { ok: true } & ConnectQrView;

export interface ConnectProgressRes {
  ok: true;
  botId: number;
  status: ConnectStatus;
  progress: ConnectProgress;
  qr: ConnectQrView;
  /** 扫码截止时间,未在扫码等待时为 null */
  deadline: number | null;
}

export interface ConnectClickRes {
  ok: true;
  x: number;
  y: number;
}

export interface ConnectOwner {
  qq: number;
  nickname: string | null;
  used: number;
  override: number | null;
  effective: number;
}

export interface ConnectOwnersRes {
  ok: true;
  owners: ConnectOwner[];
}

export interface ConnectAllBotsRes {
  ok: true;
  bots: ConnectBot[];
}

export interface ConnectLimitRes {
  ok: true;
  qq: number;
  limit: number | null;
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
