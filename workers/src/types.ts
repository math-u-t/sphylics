/**
 * bbauth Types
 * RFC 6749準拠 OAuth 2.0型定義
 */

export interface Env {
  KV: KVNamespace;
  JWT_PRIVATE_KEY: string;
  JWT_PUBLIC_KEY: string;
  ADMIN_TOKEN: string;
  ISSUER_URL: string;
  APPS_SCRIPT_URL: string;
  ALLOWED_ORIGINS: string;
}

// OAuth 2.0 Client
export interface ClientData {
  clientId: string;
  clientSecret: string | null;
  redirectUris: string[];
  allowedScopes: string[];
  clientType: 'public' | 'confidential';
  name: string;
  createdAt: number;
}

// Authorization Code
export interface AuthorizationCodeData {
  code: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  email: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  nonce?: string;
  createdAt: number;
  expiresAt: number;
}

// Refresh Token
export interface RefreshTokenData {
  token: string;
  clientId: string;
  email: string;
  scope: string;
  createdAt: number;
  expiresAt: number;
}

// Session (Apps Script往復用)
export interface SessionData {
  sessionId: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  nonce?: string;
  providerId?: string;
  createdAt: number;
  expiresAt: number;
}

// Provider (複数IdP対応用)
export interface ProviderData {
  providerId: string;
  appsScriptUrl: string;
  publicKey: string; // Ed25519 public key (base64)
  name: string;
  createdAt: number;
}

// JWT Payload
export interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  scope?: string;
  email?: string;
  email_verified?: boolean;
  nonce?: string;
}

// OAuth Error Response
export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// Token Response
export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope: string;
}

// UserInfo Response
export interface UserInfoResponse {
  sub: string;
  email: string;
  email_verified: boolean;
}

// OpenID Connect Discovery Document
export interface OIDCDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  code_challenge_methods_supported: string[];
}

// JWKS
export interface JWKS {
  keys: JWK[];
}

export interface JWK {
  kty: string;
  use: string;
  kid: string;
  alg: string;
  crv?: string;
  x?: string;
  y?: string;
  n?: string;
  e?: string;
}

// ============================================================
// Flexio API Types - Complete Implementation
// ============================================================

// ============================================================
// Token System - 5 Types of Tokens
// ============================================================

// Chat Role Types
export type ChatRole = 'blocked' | 'notParticipating' | 'audience' | 'entrant' | 'manager' | 'owner';

// Admin Role Types
export type AdminRole = 'audit' | 'dev' | 'council';

// 1. USER_TOKEN - Chat内ユーザー識別トークン
export interface UserTokenPayload {
  userName: string;
  link: string;  // チャットUUID
  savedTime: string;  // ISO 8601形式
  authority: ChatRole;
}

// 2. COMMENT_TOKEN - コメント識別トークン
export interface CommentTokenPayload {
  userToken: string;
  link: string;
  text: string;
  commentID: string;  // UUID
  commentedTime: string;  // ISO 8601形式
}

// 3. INSIDE_ACCOUNT_TOKEN - 機密情報（公開禁止）
export interface InsideAccountTokenPayload {
  bbauthAccountID: string;
  belonging: {
    [chatLink: string]: {
      authority: ChatRole;
    };
  };
  serviceJoined: string;  // ISO 8601形式
  flexioCoin: number;
}

// 4. SERVICE_TOKEN - サービス全体認証トークン
export interface ServiceTokenPayload {
  serviceID: string;
  accountID: string;
  issuedAt: string;  // ISO 8601形式
  expiresAt: string;  // ISO 8601形式
}

// 5. ADMIN_TOKEN - 管理者認証トークン
export interface AdminTokenPayload {
  userName: string;
  passwordHash: string;  // ハッシュ化済み
  authority: AdminRole;
  period: string;  // 有効期限 ISO 8601形式
}

// ============================================================
// Reaction System
// ============================================================

// 常設リアクション
export const PERMANENT_REACTIONS = {
  good: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠',
  thanks: '🙏',
  later: '⏳',
  checked: '✔️',
  typing: '✍️',
  important: '📌',
  agree: '🔁',
  ok: '🆗',
  joke: '🤡',
  hurry: '🐸',
  awesome: '🔥',
  king: '👑',
  'dead-funny': '💀',
  vote: '📊',
  'take-role': '🏷️',
  nostop: '⛔',
} as const;

// 季節限定リアクション
export interface SeasonalReaction {
  name: string;
  emoji: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export const SEASONAL_REACTIONS: SeasonalReaction[] = [
  { name: 'new-year', emoji: '🎍', startMonth: 1, startDay: 1, endMonth: 1, endDay: 1 },
  { name: 'girls-day', emoji: '🎎', startMonth: 3, startDay: 1, endMonth: 3, endDay: 1 },
  { name: 'spring', emoji: '🌸', startMonth: 3, startDay: 20, endMonth: 4, endDay: 10 },
  { name: 'childrens-day', emoji: '🎏', startMonth: 5, startDay: 5, endMonth: 5, endDay: 5 },
  { name: 'summer', emoji: '🌻', startMonth: 6, startDay: 30, endMonth: 8, endDay: 20 },
  { name: 'fireworks', emoji: '🎆', startMonth: 8, startDay: 10, endMonth: 8, endDay: 20 },
  { name: 'autumn', emoji: '🍁', startMonth: 9, startDay: 10, endMonth: 11, endDay: 20 },
  { name: 'halloween', emoji: '🎃', startMonth: 10, startDay: 31, endMonth: 10, endDay: 31 },
  { name: 'winter', emoji: '⛄', startMonth: 12, startDay: 1, endMonth: 2, endDay: 20 },
  { name: 'christmas', emoji: '🎄', startMonth: 12, startDay: 24, endMonth: 12, endDay: 25 },
];

export type ReactionName = keyof typeof PERMANENT_REACTIONS | string;

// ============================================================
// Data Models
// ============================================================

// Account (グローバル・永続的)
export interface AccountData {
  accountID: string;
  bbauthAccountID: string;
  belonging: {
    [chatLink: string]: {
      authority: ChatRole;
      userName: string;
      joinedAt: string;  // ISO 8601
    };
  };
  serviceJoined: string;  // ISO 8601
  flexioCoin: number;
  createdAt: number;
  updatedAt: number;
}

// User (チャット内・一時的)
export interface UserData {
  userName: string;
  link: string;
  authority: ChatRole;
  accountID?: string;  // 紐付けられたアカウント（オプション）
  joinedAt: string;  // ISO 8601
}

// Chat Data
export interface ChatData {
  link: string;
  title: string;
  about: string;
  tags: string[];
  recent: string;  // ISO 8601 - 最終活動時刻
  authority: {
    blocked: string[];  // userNames
    notParticipating: string[];
    audience: string[];
    entrant: string[];
    manager: string[];
    owner: string[];
  };
  createdAt: number;
  updatedAt: number;
  commentCount: number;
}

// Comment Data
export interface CommentData {
  commentID: string;
  chatLink: string;
  userName: string;
  text: string;
  commentedTime: string;  // ISO 8601
  editedTime?: string;  // ISO 8601
  reaction: {
    [userName: string]: ReactionName;
  };
  deleted: boolean;
}

// Report Data
export interface ReportData {
  reportID: string;
  type: 'comment' | 'chat';
  targetID: string;  // commentID or chatLink
  reporterName: string;
  reason: string;
  createdAt: string;  // ISO 8601
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  reviewedBy?: string;  // admin userName
  reviewedAt?: string;  // ISO 8601
}

// Admin Log
export interface AdminLogData {
  logID: string;
  adminUserName: string;
  action: string;
  targetType: 'chat' | 'comment' | 'user' | 'report' | 'document' | 'faq';
  targetID: string;
  details: any;
  timestamp: string;  // ISO 8601
}

// Notification Data
export interface NotificationData {
  notificationID: string;
  accountID: string;
  title: string;
  message: string;
  chatLink: string;
  commentID: string | null;
  createdTime: string;  // ISO 8601
  read: boolean;
}

// Trust Score Components
export interface TrustScoreData {
  chatLink: string;
  ageScore: number;  // 0-1
  userScore: number;  // 0-1
  commentScore: number;  // 0-1
  trustScore: number;  // 0-1 (weighted average)
  calculatedAt: string;  // ISO 8601
}

// ============================================================
// API Request/Response Types
// ============================================================

// Standard API Response
export interface APIResponse<T = any> {
  statusCode: number;
  content: T;
}

export interface APIErrorResponse {
  statusCode: number;
  error: string;
  content: string;
}

// Chat List Request
export interface ChatListRequest {
  token: string;  // SERVICE_TOKEN
  content: {
    query: string;
    type: 'belonging' | 'all' | 'tag' | 'time';
  };
}

// Chat List Response
export interface ChatListResponse {
  chat: {
    [chatLink: string]: {
      title: string;
      about: string;
      tag: string[];
      recent: string;  // ISO 8601
      authority: {
        blocked: string[];
        audience: string[];
        entrant: string[];
        manager: string[];
        owner: string[];
      };
    };
  };
}

// Comment Post Request
export interface CommentPostRequest {
  token: string;  // SERVICE_TOKEN
  content: {
    joinUserToken: string;  // USER_TOKEN
    comment: {
      text: string;
    };
  };
}

// Comment Edit Request
export interface CommentEditRequest {
  token: string;
  content: {
    sendUserToken: string;
    commentID: string;
    edited: string;
  };
}

// Chat Get Response
export interface ChatGetResponse {
  chat: {
    comment: {
      [commentId: string]: {
        text: string;
        commentedTime: string;
        userName: string;
        reaction: {
          [userName: string]: string;  // reaction name
        };
      };
    };
    information: {
      title: string;
      about: string;
      tag: string[];
      recent: string;
      authority: {
        blocked: string[];
        audience: string[];
        entrant: string[];
        manager: string[];
        owner: string[];
      };
    };
  };
}

// Reaction Add Request
export interface ReactionAddRequest {
  token: string;
  content: {
    userToken: string;
    commentID: string;
    reactionName: string;
  };
}

// Admin Login Request
export interface AdminLoginRequest {
  userName: string;
  password: string;
}

// Notification Response
export interface NotificationResponse {
  notifications: Array<{
    notificationID: string;
    title: string;
    message: string;
    chatLink: string;
    commentID: string | null;
    createdTime: string;
    read: boolean;
  }>;
  total: number;
}

// Service Stats Response
export interface ServiceStatsResponse {
  totalChats: number;
  totalComments: number;
  totalUsers: number;
  activeChatsLast24h: number;
  activeUsersLast24h: number;
  averageTrustScore: number;
}

// Chat creation request
export interface ChatCreateRequest {
  token: string;
  future?: any;
  content: {
    title: string;
    about: string;
    tag: string[];
    link: string;
  };
}

// Chat update request
export interface ChatUpdateRequest {
  token: string;
  link: string;
  content: {
    title?: string;
    about?: string;
    tag?: string[];
  };
}

// Chat delete request
export interface ChatDeleteRequest {
  token: string;
  link: string;
}

// Chat response
export interface ChatResponse {
  link: string;
  title: string;
  about: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  participantCount: number;
  isAdmin?: boolean;
}
