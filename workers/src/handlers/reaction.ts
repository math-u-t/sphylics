/**
 * Reaction Handlers
 * リアクション追加・削除
 */

import {
  Env,
  CommentData,
  ReactionAddRequest,
  APIResponse,
  APIErrorResponse,
} from '../types';
import { requireUserToken, canPerformAction, getUserRole } from '../middleware/auth';
import { isValidReaction, getReactionEmoji } from '../utils/reactions';

/**
 * リアクション追加 - POST /chat/:chatLink/comment/reaction
 */
export async function handleReactionAdd(
  request: Request,
  env: Env,
  chatLink: string
): Promise<Response> {
  try {
    const body = await request.json() as ReactionAddRequest;

    if (!body.token || !body.content?.userToken || !body.content?.commentID || !body.content?.reactionName) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // USER_TOKENを検証
    const userPayload = await requireUserToken(body.content.userToken, env);
    if (!userPayload) {
      return createErrorResponse(401, 'Invalid user token');
    }

    // チャットが存在するか確認
    const chatDataStr = await env.KV.get(`chat:${chatLink}`);
    if (!chatDataStr) {
      return createErrorResponse(404, 'Chat not found');
    }

    // ユーザーのロールを取得
    const userRole = await getUserRole(chatLink, userPayload.userName, env);
    if (!userRole) {
      return createErrorResponse(403, 'User is not a member of this chat');
    }

    // 閲覧権限をチェック（audience以上）
    if (!canPerformAction(userRole, 'view')) {
      return createErrorResponse(403, 'Insufficient permissions to add reaction');
    }

    // リアクション名が有効かチェック
    if (!isValidReaction(body.content.reactionName)) {
      return createErrorResponse(400, 'Invalid reaction name or seasonal reaction is not active');
    }

    // コメントを取得
    const commentDataStr = await env.KV.get(`comment:${body.content.commentID}`);
    if (!commentDataStr) {
      return createErrorResponse(404, 'Comment not found');
    }

    const comment: CommentData = JSON.parse(commentDataStr);

    // 削除済みコメントにはリアクション不可
    if (comment.deleted) {
      return createErrorResponse(410, 'Cannot add reaction to deleted comment');
    }

    // リアクションを追加（または更新）
    comment.reaction[userPayload.userName] = body.content.reactionName;

    // KVに保存
    await env.KV.put(`comment:${body.content.commentID}`, JSON.stringify(comment));

    const emoji = getReactionEmoji(body.content.reactionName);

    const response: APIResponse = {
      statusCode: 200,
      content: {
        commentID: comment.commentID,
        userName: userPayload.userName,
        reactionName: body.content.reactionName,
        emoji,
        reactions: comment.reaction,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reaction add error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * リアクション削除 - DELETE /chat/:chatLink/comment/:commentId/reaction
 */
export async function handleReactionRemove(
  request: Request,
  env: Env,
  chatLink: string,
  commentId: string
): Promise<Response> {
  try {
    const body = await request.json() as { token: string; userToken: string };

    if (!body.token || !body.userToken) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // USER_TOKENを検証
    const userPayload = await requireUserToken(body.userToken, env);
    if (!userPayload) {
      return createErrorResponse(401, 'Invalid user token');
    }

    // コメントを取得
    const commentDataStr = await env.KV.get(`comment:${commentId}`);
    if (!commentDataStr) {
      return createErrorResponse(404, 'Comment not found');
    }

    const comment: CommentData = JSON.parse(commentDataStr);

    // リアクションを削除
    if (comment.reaction[userPayload.userName]) {
      delete comment.reaction[userPayload.userName];

      // KVに保存
      await env.KV.put(`comment:${commentId}`, JSON.stringify(comment));
    }

    const response: APIResponse = {
      statusCode: 200,
      content: {
        commentID: comment.commentID,
        userName: userPayload.userName,
        reactions: comment.reaction,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reaction remove error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * 利用可能なリアクション一覧を取得 - GET /chat/reactions
 */
export async function handleReactionList(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const { getAllAvailableReactions } = await import('../utils/reactions');
    const reactions = getAllAvailableReactions();

    const response: APIResponse = {
      statusCode: 200,
      content: {
        permanent: reactions.permanent,
        seasonal: reactions.seasonal.map(r => ({
          name: r.name,
          emoji: r.emoji,
          period: `${r.startMonth}/${r.startDay} - ${r.endMonth}/${r.endDay}`,
        })),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reaction list error:', error);
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
