/**
 * Authentication Middleware
 * トークン検証と権限チェック
 */

import { Env, ChatRole, AdminRole } from '../types';
import {
  verifyUserToken,
  verifyServiceToken,
  verifyAdminToken,
  verifyInsideAccountToken,
} from '../utils/tokens';

/**
 * サービストークンを検証
 */
export async function requireServiceToken(
  request: Request,
  env: Env
): Promise<{ accountID: string } | Response> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || '';

  if (!token) {
    return new Response(
      JSON.stringify({
        statusCode: 401,
        error: 'Unauthorized',
        content: 'Missing service token',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const payload = await verifyServiceToken(token, env);
  if (!payload) {
    return new Response(
      JSON.stringify({
        statusCode: 401,
        error: 'Unauthorized',
        content: 'Invalid service token',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { accountID: payload.accountID };
}

/**
 * 管理者トークンを検証
 */
export async function requireAdminToken(
  request: Request,
  env: Env,
  requiredRole?: AdminRole
): Promise<{ userName: string; authority: AdminRole } | Response> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || '';

  if (!token) {
    return new Response(
      JSON.stringify({
        statusCode: 401,
        error: 'Unauthorized',
        content: 'Missing admin token',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const payload = await verifyAdminToken(token, env);
  if (!payload) {
    return new Response(
      JSON.stringify({
        statusCode: 401,
        error: 'Unauthorized',
        content: 'Invalid admin token',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 特定のロールが必要な場合
  if (requiredRole && payload.authority !== requiredRole) {
    return new Response(
      JSON.stringify({
        statusCode: 403,
        error: 'Forbidden',
        content: `Required role: ${requiredRole}`,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { userName: payload.userName, authority: payload.authority };
}

/**
 * ユーザートークンを検証
 */
export async function requireUserToken(
  token: string,
  env: Env
): Promise<{ userName: string; link: string; authority: ChatRole } | null> {
  const payload = await verifyUserToken(token, env);
  if (!payload) {
    return null;
  }

  return {
    userName: payload.userName,
    link: payload.link,
    authority: payload.authority,
  };
}

/**
 * チャット権限をチェック
 * @param chatLink チャットリンク
 * @param userName ユーザー名
 * @param requiredRole 必要な最小ロール
 * @param env 環境変数
 * @returns 権限があればtrue
 */
export async function checkChatPermission(
  chatLink: string,
  userName: string,
  requiredRole: ChatRole,
  env: Env
): Promise<boolean> {
  const chatDataStr = await env.KV.get(`chat:${chatLink}`);
  if (!chatDataStr) {
    return false;
  }

  const chatData = JSON.parse(chatDataStr);
  const authority = chatData.authority;

  // ロールの優先順位
  const roleHierarchy: ChatRole[] = ['owner', 'manager', 'entrant', 'audience', 'notParticipating', 'blocked'];

  // ユーザーの現在のロールを取得
  let userRole: ChatRole | null = null;
  for (const role of roleHierarchy) {
    if (authority[role]?.includes(userName)) {
      userRole = role;
      break;
    }
  }

  if (!userRole) {
    return false;
  }

  // 必要なロール以上の権限があるかチェック
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex <= requiredRoleIndex;
}

/**
 * ユーザーのチャット内ロールを取得
 */
export async function getUserRole(
  chatLink: string,
  userName: string,
  env: Env
): Promise<ChatRole | null> {
  const chatDataStr = await env.KV.get(`chat:${chatLink}`);
  if (!chatDataStr) {
    return null;
  }

  const chatData = JSON.parse(chatDataStr);
  const authority = chatData.authority;

  const roles: ChatRole[] = ['owner', 'manager', 'entrant', 'audience', 'notParticipating', 'blocked'];

  for (const role of roles) {
    if (authority[role]?.includes(userName)) {
      return role;
    }
  }

  return null;
}

/**
 * チャット内で特定の操作が可能かチェック
 */
export function canPerformAction(
  userRole: ChatRole,
  action: 'view' | 'post' | 'edit' | 'delete' | 'manage' | 'editChat' | 'report'
): boolean {
  const permissions: { [key in ChatRole]: string[] } = {
    blocked: ['report'],
    notParticipating: ['report'],
    audience: ['view', 'report'],
    entrant: ['view', 'post', 'edit', 'delete', 'report'],
    manager: ['view', 'post', 'edit', 'delete', 'manage', 'report'],
    owner: ['view', 'post', 'edit', 'delete', 'manage', 'editChat', 'report'],
  };

  return permissions[userRole]?.includes(action) || false;
}
