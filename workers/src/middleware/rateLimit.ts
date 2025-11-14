/**
 * Rate Limiting Middleware
 * 1分間に60リクエストまで
 */

import { Env } from '../types';

interface RateLimitData {
  count: number;
  resetAt: number;
}

/**
 * レート制限をチェック
 * @param identifier ユーザー識別子（IP、アカウントIDなど）
 * @param env 環境変数
 * @param limit 制限数（デフォルト: 60）
 * @param windowSeconds ウィンドウ時間（秒、デフォルト: 60）
 * @returns レート制限を超えている場合はResponseを返す
 */
export async function checkRateLimit(
  identifier: string,
  env: Env,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<Response | null> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  // 現在のレート制限データを取得
  const dataStr = await env.KV.get(key);
  let data: RateLimitData;

  if (dataStr) {
    data = JSON.parse(dataStr);

    // ウィンドウがリセットされているかチェック
    if (now > data.resetAt) {
      data = {
        count: 1,
        resetAt: now + windowSeconds * 1000,
      };
    } else {
      data.count++;
    }
  } else {
    data = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
  }

  // KVに保存
  await env.KV.put(key, JSON.stringify(data), {
    expirationTtl: windowSeconds * 2,
  });

  // レート制限チェック
  if (data.count > limit) {
    const retryAfter = Math.ceil((data.resetAt - now) / 1000);

    return new Response(
      JSON.stringify({
        statusCode: 429,
        error: 'Too Many Requests',
        content: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': data.resetAt.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * リクエストからクライアント識別子を取得
 */
export function getClientIdentifier(request: Request): string {
  // CF-Connecting-IP ヘッダー（Cloudflare経由の場合）
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) {
    return cfIP;
  }

  // X-Forwarded-For ヘッダー
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // フォールバック: 固定値（開発環境用）
  return 'unknown';
}

/**
 * レート制限ミドルウェア（リクエストに適用）
 */
export async function rateLimitMiddleware(
  request: Request,
  env: Env
): Promise<Response | null> {
  const identifier = getClientIdentifier(request);
  return await checkRateLimit(identifier, env);
}
