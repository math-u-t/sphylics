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
// Chat API Types
// ============================================================

// Chat Data stored in KV
export interface ChatData {
  link: string;
  title: string;
  about: string;
  tags: string[];
  adminToken: string;  // tokenで管理者を特定
  createdAt: number;
  updatedAt: number;
  participantCount: number;
}

// Chat creation request
export interface ChatCreateRequest {
  token: string;
  future?: any;  // 将来の拡張用
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
  isAdmin?: boolean;  // リクエストユーザーが管理者かどうか
}

// API Standard Response
export interface APIResponse<T = any> {
  statusCode: number;
  content: T | string;
  error?: string;
}
