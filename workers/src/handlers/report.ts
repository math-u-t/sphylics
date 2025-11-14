/**
 * Report Handlers
 * コメント・チャット報告機能
 */

import {
  Env,
  ReportData,
  APIResponse,
  APIErrorResponse,
} from '../types';
import { requireUserToken, getUserRole, canPerformAction } from '../middleware/auth';
import { generateUUID, getCurrentTimestamp } from '../utils/tokens';

/**
 * コメント報告 - POST /chat/:chatLink/comment/:commentId/report
 */
export async function handleCommentReport(
  request: Request,
  env: Env,
  chatLink: string,
  commentId: string
): Promise<Response> {
  try {
    const body = await request.json() as {
      token: string;
      userToken: string;
      reason: string;
    };

    if (!body.token || !body.userToken || !body.reason) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // USER_TOKENを検証
    const userPayload = await requireUserToken(body.userToken, env);
    if (!userPayload) {
      return createErrorResponse(401, 'Invalid user token');
    }

    // ユーザーのロールを取得
    const userRole = await getUserRole(chatLink, userPayload.userName, env);
    if (!userRole) {
      return createErrorResponse(403, 'User is not a member of this chat');
    }

    // 報告権限をチェック（全ユーザーが可能）
    if (!canPerformAction(userRole, 'report')) {
      return createErrorResponse(403, 'Insufficient permissions to report');
    }

    // コメントが存在するか確認
    const commentDataStr = await env.KV.get(`comment:${commentId}`);
    if (!commentDataStr) {
      return createErrorResponse(404, 'Comment not found');
    }

    // 報告を作成
    const reportID = generateUUID();
    const report: ReportData = {
      reportID,
      type: 'comment',
      targetID: commentId,
      reporterName: userPayload.userName,
      reason: body.reason,
      createdAt: getCurrentTimestamp(),
      status: 'pending',
    };

    // KVに保存
    await env.KV.put(`report:${reportID}`, JSON.stringify(report));
    await env.KV.put(`report:comment:${commentId}:${reportID}`, reportID);

    const response: APIResponse = {
      statusCode: 201,
      content: {
        reportID,
        message: 'Comment reported successfully',
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Comment report error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * チャット報告 - POST /chat/:chatLink/report
 */
export async function handleChatReport(
  request: Request,
  env: Env,
  chatLink: string
): Promise<Response> {
  try {
    const body = await request.json() as {
      token: string;
      userToken: string;
      reason: string;
    };

    if (!body.token || !body.userToken || !body.reason) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // USER_TOKENを検証
    const userPayload = await requireUserToken(body.userToken, env);
    if (!userPayload) {
      return createErrorResponse(401, 'Invalid user token');
    }

    // チャットが存在するか確認
    const chatDataStr = await env.KV.get(`chat:${chatLink}`);
    if (!chatDataStr) {
      return createErrorResponse(404, 'Chat not found');
    }

    // 報告を作成
    const reportID = generateUUID();
    const report: ReportData = {
      reportID,
      type: 'chat',
      targetID: chatLink,
      reporterName: userPayload.userName,
      reason: body.reason,
      createdAt: getCurrentTimestamp(),
      status: 'pending',
    };

    // KVに保存
    await env.KV.put(`report:${reportID}`, JSON.stringify(report));
    await env.KV.put(`report:chat:${chatLink}:${reportID}`, reportID);

    const response: APIResponse = {
      statusCode: 201,
      content: {
        reportID,
        message: 'Chat reported successfully',
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat report error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * 報告一覧取得（管理者用） - GET /admin/reports
 */
export async function handleReportsList(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const type = url.searchParams.get('type') || 'all';

    // 報告一覧を取得
    const reportKeys = await env.KV.list({ prefix: 'report:' });
    const reports: ReportData[] = [];

    for (const key of reportKeys.keys) {
      // プレフィックスのみのキーはスキップ
      if (key.name.includes(':comment:') || key.name.includes(':chat:')) {
        continue;
      }

      const reportDataStr = await env.KV.get(key.name);
      if (reportDataStr) {
        const report: ReportData = JSON.parse(reportDataStr);

        // フィルター
        if (status !== 'all' && report.status !== status) {
          continue;
        }
        if (type !== 'all' && report.type !== type) {
          continue;
        }

        reports.push(report);
      }
    }

    // 作成日時で降順ソート
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: APIResponse = {
      statusCode: 200,
      content: {
        reports,
        total: reports.length,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reports list error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * 報告処理（管理者用） - POST /admin/report/:reportId/review
 */
export async function handleReportReview(
  request: Request,
  env: Env,
  reportId: string,
  adminUserName: string
): Promise<Response> {
  try {
    const body = await request.json() as {
      action: 'resolve' | 'reject';
      notes?: string;
    };

    if (!body.action) {
      return createErrorResponse(400, 'Missing action field');
    }

    // 報告を取得
    const reportDataStr = await env.KV.get(`report:${reportId}`);
    if (!reportDataStr) {
      return createErrorResponse(404, 'Report not found');
    }

    const report: ReportData = JSON.parse(reportDataStr);

    // ステータスを更新
    report.status = body.action === 'resolve' ? 'resolved' : 'rejected';
    report.reviewedBy = adminUserName;
    report.reviewedAt = getCurrentTimestamp();

    // KVに保存
    await env.KV.put(`report:${reportId}`, JSON.stringify(report));

    const response: APIResponse = {
      statusCode: 200,
      content: {
        reportID: report.reportID,
        status: report.status,
        reviewedBy: report.reviewedBy,
        reviewedAt: report.reviewedAt,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Report review error:', error);
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
