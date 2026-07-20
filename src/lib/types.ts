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

export type CardKind = "month" | "quarter" | "year";

export interface CardsAvailable {
  ok: true;
  month: number;
  quarter: number;
  year: number;
}
export interface CardsAvailableOne {
  ok: true;
  count: number;
}
export interface CardRedeemReq {
  code: string;
}
export interface CardRedeemRes {
  ok: true;
  kind: CardKind;
  days: number;
  memberUntil: number;
}
export interface CardCodesReq {
  kind: CardKind;
}
export interface CardCodesRes {
  ok: true;
  kind: CardKind;
  codes: string[];
}

export interface ManagedGroup {
  groupId: number;
  groupName: string;
  memberCount: number;
  groupAvatar: string;
  role: "owner" | "admin";
  claimed: boolean;
  botEnabled: boolean;
}
export type GroupsManagedRes = ManagedGroup[];
export interface GroupClaimReq {
  groupId: number;
  topic: string;
  botQqs: number[];
  channel: string;
}
export interface AccessHookEntry {
  plugin: string;
  hookId: string;
  action: "allow" | "block";
}
export interface AiControlState {
  [field: string]: boolean;
}
export interface GroupDetailRes {
  ok: true;
  groupId: number;
  groupName: string;
  memberCount: number;
  groupAvatar: string;
  role: "owner" | "admin";
  claimed: boolean;
  claimedBy?: number;
  topic?: string;
  botQqs?: number[];
  channel?: string;
  botEnabled: boolean;
  accessHooks: AccessHookEntry[];
  aiControl: AiControlState;
}

export interface AccessHookDef {
  id: string;
  match?: string;
  event?: string;
  description?: string;
}
export interface FeaturesAccessHooksRes {
  ok: true;
  plugins: { plugin: string; hooks: AccessHookDef[] }[];
}
export interface HelpCommand {
  cmd: string;
  desc: string;
  role?: string;
}
export interface FeaturesHelpRes {
  ok: true;
  plugins: {
    plugin: string;
    help: {
      title: string;
      description: string;
      commands: HelpCommand[];
    };
  }[];
}

export interface BotEnabledReq {
  groupId: number;
  enabled: boolean;
}
export interface BotEnabledRes {
  ok: true;
  groupId: number;
  enabled: boolean;
}
export interface BotAccessHookReq {
  groupId: number;
  plugin: string;
  hookId: string;
  action: "allow" | "block";
}
export interface BotAccessHookRes {
  ok: true;
  groupId: number;
  plugin: string;
  hookId: string;
  action: "allow" | "block";
}

export type AiField =
  | "emoji"
  | "expression"
  | "retention"
  | "memory"
  | "topic"
  | "planner"
  | "audio"
  | "searxng"
  | "webReader"
  | "dynamicDelay"
  | "enableMarkdownScreenshot"
  | "enableMediaRecognition";

export interface AiControlReq {
  groupId: number;
  field: AiField;
  value: boolean;
}
export interface AiControlRes {
  ok: true;
  groupId: number;
  field: AiField;
  value: boolean;
}

export interface InviteReq {
  groupId: number;
  topic: string;
  botQqs: number[];
  channel: string;
  allowBotAdmin: boolean;
}
export type InviteStatus = "pending" | "approved" | "rejected";
export interface Invite {
  id: number;
  groupId: number;
  applicantQq: number;
  topic: string;
  botQqs: number[];
  channel: string;
  allowBotAdmin: boolean;
  status: InviteStatus;
  reviewerQq: number | null;
  reviewReason: string | null;
  createdAt: number;
  reviewedAt: number | null;
}
export interface InvitesRes {
  ok: true;
  invites: Invite[];
}
export interface InviteReviewReq {
  id: number;
  approved: boolean;
  reason?: string;
}
export interface InviteReviewRes {
  ok: true;
  id: number;
  status: InviteStatus;
  reviewerQq: number;
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
export interface FeedbackDetailRes {
  ok: true;
  feedback: Feedback;
  comments: FeedbackComment[];
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

// ===== 订阅 / 兑换记录 =====
export interface CardRedeem {
  id: number;
  qq: number;
  code: string;
  kind: CardKind;
  days: number;
  beforeMemberUntil: number | null;
  afterMemberUntil: number;
  createdAt: number;
  nickname: string | null;
}
export interface SubscriptionsRedeemsRes {
  ok: true;
  redeems: CardRedeem[];
}
export interface SubscriptionMember {
  qq: number;
  nickname: string | null;
  role: Role;
  memberUntil: number | null;
  createdAt: number;
}
export interface SubscriptionsMembersRes {
  ok: true;
  members: SubscriptionMember[];
}
export interface SetMembershipReq {
  qq: number;
  memberUntil: number | null;
}
export interface SetMembershipRes {
  ok: true;
  qq: number;
  memberUntil: number | null;
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
