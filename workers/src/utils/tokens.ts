/**
 * Flexio Token System
 * 5種類のトークン生成・検証ユーティリティ
 */

import {
  UserTokenPayload,
  CommentTokenPayload,
  InsideAccountTokenPayload,
  ServiceTokenPayload,
  AdminTokenPayload,
  Env,
} from '../types';
import { signJWT, verifyJWT, generateRandomToken } from '../crypto';

// ============================================================
// Token Generation
// ============================================================

/**
 * USER_TOKEN 生成
 * チャット内ユーザーの識別トークン
 */
export async function generateUserToken(
  payload: UserTokenPayload,
  env: Env
): Promise<string> {
  const jwtPayload = {
    iss: env.ISSUER_URL,
    sub: `user:${payload.userName}`,
    aud: 'flexio-chat',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 365, // 1年
    ...payload,
  };

  return await signJWT(jwtPayload, env.JWT_PRIVATE_KEY);
}

/**
 * COMMENT_TOKEN 生成
 * コメントの識別トークン
 */
export async function generateCommentToken(
  payload: CommentTokenPayload,
  env: Env
): Promise<string> {
  const jwtPayload = {
    iss: env.ISSUER_URL,
    sub: `comment:${payload.commentID}`,
    aud: 'flexio-comment',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 365, // 1年
    ...payload,
  };

  return await signJWT(jwtPayload, env.JWT_PRIVATE_KEY);
}

/**
 * INSIDE_ACCOUNT_TOKEN 生成
 * 機密情報トークン（絶対に公開しない）
 */
export async function generateInsideAccountToken(
  payload: InsideAccountTokenPayload,
  env: Env
): Promise<string> {
  const jwtPayload = {
    iss: env.ISSUER_URL,
    sub: `account:${payload.bbauthAccountID}`,
    aud: 'flexio-internal',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 365, // 1年
    ...payload,
  };

  return await signJWT(jwtPayload, env.JWT_PRIVATE_KEY);
}

/**
 * SERVICE_TOKEN 生成
 * サービス全体の認証トークン
 */
export async function generateServiceToken(
  accountID: string,
  env: Env
): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 86400 * 30 * 1000); // 30日

  const payload: ServiceTokenPayload = {
    serviceID: 'flexio',
    accountID,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const jwtPayload = {
    iss: env.ISSUER_URL,
    sub: `service:${accountID}`,
    aud: 'flexio-service',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
    ...payload,
  };

  return await signJWT(jwtPayload, env.JWT_PRIVATE_KEY);
}

/**
 * ADMIN_TOKEN 生成
 * 管理者認証トークン
 */
export async function generateAdminToken(
  payload: Omit<AdminTokenPayload, 'passwordHash'> & { passwordHash: string },
  env: Env
): Promise<string> {
  const periodDate = new Date(payload.period);

  const jwtPayload = {
    iss: env.ISSUER_URL,
    sub: `admin:${payload.userName}`,
    aud: 'flexio-admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(periodDate.getTime() / 1000),
    ...payload,
  };

  return await signJWT(jwtPayload, env.JWT_PRIVATE_KEY);
}

// ============================================================
// Token Verification
// ============================================================

/**
 * USER_TOKEN 検証
 */
export async function verifyUserToken(
  token: string,
  env: Env
): Promise<UserTokenPayload | null> {
  const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
  if (!payload || payload.aud !== 'flexio-chat') {
    return null;
  }

  return {
    userName: payload.userName,
    link: payload.link,
    savedTime: payload.savedTime,
    authority: payload.authority,
  };
}

/**
 * COMMENT_TOKEN 検証
 */
export async function verifyCommentToken(
  token: string,
  env: Env
): Promise<CommentTokenPayload | null> {
  const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
  if (!payload || payload.aud !== 'flexio-comment') {
    return null;
  }

  return {
    userToken: payload.userToken,
    link: payload.link,
    text: payload.text,
    commentID: payload.commentID,
    commentedTime: payload.commentedTime,
  };
}

/**
 * INSIDE_ACCOUNT_TOKEN 検証
 */
export async function verifyInsideAccountToken(
  token: string,
  env: Env
): Promise<InsideAccountTokenPayload | null> {
  const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
  if (!payload || payload.aud !== 'flexio-internal') {
    return null;
  }

  return {
    bbauthAccountID: payload.bbauthAccountID,
    belonging: payload.belonging,
    serviceJoined: payload.serviceJoined,
    flexioCoin: payload.flexioCoin,
  };
}

/**
 * SERVICE_TOKEN 検証
 */
export async function verifyServiceToken(
  token: string,
  env: Env
): Promise<ServiceTokenPayload | null> {
  const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
  if (!payload || payload.aud !== 'flexio-service') {
    return null;
  }

  // 有効期限チェック
  const expiresAt = new Date(payload.expiresAt);
  if (expiresAt < new Date()) {
    return null;
  }

  return {
    serviceID: payload.serviceID,
    accountID: payload.accountID,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  };
}

/**
 * ADMIN_TOKEN 検証
 */
export async function verifyAdminToken(
  token: string,
  env: Env
): Promise<AdminTokenPayload | null> {
  const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
  if (!payload || payload.aud !== 'flexio-admin') {
    return null;
  }

  // 有効期限チェック
  const period = new Date(payload.period);
  if (period < new Date()) {
    return null;
  }

  return {
    userName: payload.userName,
    passwordHash: payload.passwordHash,
    authority: payload.authority,
    period: payload.period,
  };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * UUID v4 生成
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * パスワードハッシュ生成（bcryptの代替としてSHA-256を使用）
 * 本番環境ではより強力なハッシュアルゴリズムを推奨
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const actualSalt = salt || generateRandomToken(16);
  const encoder = new TextEncoder();
  const data = encoder.encode(password + actualSalt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${actualSalt}:${hashHex}`;
}

/**
 * パスワード検証
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, expectedHash] = hash.split(':');
  const actualHash = await hashPassword(password, salt);
  return actualHash === hash;
}

/**
 * 現在の日時をISO 8601形式で取得
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
