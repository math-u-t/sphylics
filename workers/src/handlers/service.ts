/**
 * Service Handlers
 * サービス統計・詳細・通知機能
 */

import {
  Env,
  ServiceStatsResponse,
  NotificationResponse,
  NotificationData,
  APIResponse,
  APIErrorResponse,
  AdminLogData,
} from '../types';
import { requireServiceToken } from '../middleware/auth';
import { generateUUID, getCurrentTimestamp } from '../utils/tokens';

/**
 * サービス統計 - POST /service/stats
 */
export async function handleServiceStats(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // サービストークンを検証
    const authResult = await requireServiceToken(request, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    // チャット総数を取得
    const chatList = await env.KV.list({ prefix: 'chat:' });
    const totalChats = chatList.keys.filter(k => !k.name.includes(':')).length;

    // コメント総数を取得
    const commentList = await env.KV.list({ prefix: 'comment:' });
    const totalComments = commentList.keys.length;

    // ユーザー総数を取得（推定）
    const userSet = new Set<string>();
    for (const key of commentList.keys) {
      const commentDataStr = await env.KV.get(key.name);
      if (commentDataStr) {
        const comment = JSON.parse(commentDataStr);
        userSet.add(comment.userName);
      }
    }
    const totalUsers = userSet.size;

    // 過去24時間のアクティブチャット数
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    let activeChatsLast24h = 0;

    for (const key of chatList.keys) {
      if (key.name.includes(':')) continue;
      const chatDataStr = await env.KV.get(key.name);
      if (chatDataStr) {
        const chat = JSON.parse(chatDataStr);
        if (chat.updatedAt >= oneDayAgo) {
          activeChatsLast24h++;
        }
      }
    }

    // 平均信頼スコアを取得
    const trustScoreList = await env.KV.list({ prefix: 'trust:' });
    let totalTrustScore = 0;
    let trustScoreCount = 0;

    for (const key of trustScoreList.keys) {
      const trustDataStr = await env.KV.get(key.name);
      if (trustDataStr) {
        const trustData = JSON.parse(trustDataStr);
        totalTrustScore += trustData.trustScore;
        trustScoreCount++;
      }
    }

    const averageTrustScore = trustScoreCount > 0 ? totalTrustScore / trustScoreCount : 0;

    const stats: ServiceStatsResponse = {
      totalChats,
      totalComments,
      totalUsers,
      activeChatsLast24h,
      activeUsersLast24h: 0, // 実装簡略化のため0
      averageTrustScore: parseFloat(averageTrustScore.toFixed(3)),
    };

    const response: APIResponse<ServiceStatsResponse> = {
      statusCode: 200,
      content: stats,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Service stats error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * サービス詳細 - POST /service/detail
 */
export async function handleServiceDetail(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const response: APIResponse = {
      statusCode: 200,
      content: {
        serviceName: 'Flexio',
        version: '1.0.0',
        description: '匿名性を保持したチャット・コメントシステム',
        features: [
          'Anonymous chat rooms',
          'Comment reactions',
          'Seasonal reactions',
          'Trust score system',
          'User role management',
          'Report system',
          'Admin logging',
        ],
        endpoints: {
          chat: [
            'GET /chat/list',
            'POST /chat/new',
            'GET /chat/:chatLink',
            'POST /chat/:chatLink/join',
            'POST /chat/:chatLink/edit',
            'POST /chat/:chatLink/del',
          ],
          comment: [
            'POST /chat/:chatLink/post',
            'POST /chat/:chatLink/comment/edit',
            'POST /chat/:chatLink/del/:commentId',
          ],
          reaction: [
            'POST /chat/:chatLink/comment/reaction',
            'GET /chat/reactions',
          ],
          report: [
            'POST /chat/:chatLink/comment/:commentId/report',
            'POST /chat/:chatLink/report',
          ],
          admin: [
            'POST /admin/login',
            'GET /admin/reports',
            'POST /admin/report/:reportId/review',
            'GET /service/admin',
          ],
        },
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Service detail error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * 通知取得（bbauth連携） - POST /notification/bbauth
 */
export async function handleNotificationList(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // サービストークンを検証
    const authResult = await requireServiceToken(request, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { accountID } = authResult;

    // 通知一覧を取得
    const notificationKeys = await env.KV.list({ prefix: `notification:${accountID}:` });
    const notifications: NotificationData[] = [];

    for (const key of notificationKeys.keys) {
      const notificationDataStr = await env.KV.get(key.name);
      if (notificationDataStr) {
        const notification: NotificationData = JSON.parse(notificationDataStr);
        notifications.push(notification);
      }
    }

    // 作成日時で降順ソート
    notifications.sort((a, b) =>
      new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
    );

    const responseData: NotificationResponse = {
      notifications: notifications.map(n => ({
        notificationID: n.notificationID,
        title: n.title,
        message: n.message,
        chatLink: n.chatLink,
        commentID: n.commentID,
        createdTime: n.createdTime,
        read: n.read,
      })),
      total: notifications.length,
    };

    const response: APIResponse<NotificationResponse> = {
      statusCode: 200,
      content: responseData,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Notification list error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * 通知作成（内部関数）
 */
export async function createNotification(
  accountID: string,
  title: string,
  message: string,
  chatLink: string,
  commentID: string | null,
  env: Env
): Promise<void> {
  const notificationID = generateUUID();
  const notification: NotificationData = {
    notificationID,
    accountID,
    title,
    message,
    chatLink,
    commentID,
    createdTime: getCurrentTimestamp(),
    read: false,
  };

  await env.KV.put(
    `notification:${accountID}:${notificationID}`,
    JSON.stringify(notification)
  );
}

/**
 * 管理者ログ記録
 */
export async function logAdminAction(
  adminUserName: string,
  action: string,
  targetType: 'chat' | 'comment' | 'user' | 'report' | 'document' | 'faq',
  targetID: string,
  details: any,
  env: Env
): Promise<void> {
  const logID = generateUUID();
  const log: AdminLogData = {
    logID,
    adminUserName,
    action,
    targetType,
    targetID,
    details,
    timestamp: getCurrentTimestamp(),
  };

  await env.KV.put(`adminlog:${logID}`, JSON.stringify(log));
  await env.KV.put(`adminlog:user:${adminUserName}:${logID}`, logID);
}

/**
 * 管理者ログ取得 - POST /service/admin
 */
export async function handleAdminLogs(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const adminUserName = url.searchParams.get('admin');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let logKeys;
    if (adminUserName) {
      logKeys = await env.KV.list({ prefix: `adminlog:user:${adminUserName}:`, limit });
    } else {
      logKeys = await env.KV.list({ prefix: 'adminlog:', limit });
    }

    const logs: AdminLogData[] = [];

    for (const key of logKeys.keys) {
      // user プレフィックスの場合は実際のログIDを取得
      let logID = key.name;
      if (key.name.includes(':user:')) {
        const actualLogID = await env.KV.get(key.name);
        if (actualLogID) {
          logID = `adminlog:${actualLogID}`;
        } else {
          continue;
        }
      }

      const logDataStr = await env.KV.get(logID);
      if (logDataStr) {
        const log: AdminLogData = JSON.parse(logDataStr);
        logs.push(log);
      }
    }

    // タイムスタンプで降順ソート
    logs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const response: APIResponse = {
      statusCode: 200,
      content: {
        logs,
        total: logs.length,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * エラーレスポンス作成
 */
function createErrorResponse(statusCode: number, message: string): Response {
  const response: APIErrorResponse = {
    statusCode,
    error: message,
    content: message,
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
