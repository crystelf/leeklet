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
export interface CardPurchaseReq {
  kind: CardKind;
}
export interface CardPurchaseRes {
  ok: true;
  code: string;
  kind: CardKind;
  days: number;
  consumed: boolean;
  memberUntil?: number;
  note?: string;
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
export interface Feedback {
  id: number;
  userQq: number;
  content: string;
  images: string[];
  status: FeedbackStatus;
  createdAt: number;
  updatedAt: number;
}
export interface FeedbackCreateReq {
  content: string;
  images?: string[];
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
  content: string;
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

export type ApiResult<T> = T | ApiError;
