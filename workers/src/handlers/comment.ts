/**
 * Comment Handlers
 * コメント投稿・編集・削除・取得
 */

import {
  Env,
  CommentData,
  CommentPostRequest,
  CommentEditRequest,
  APIResponse,
  APIErrorResponse,
  ChatData,
} from '../types';
import { requireUserToken, canPerformAction, getUserRole } from '../middleware/auth';
import { generateUUID, getCurrentTimestamp } from '../utils/tokens';

/**
 * コメント投稿 - POST /chat/:chatLink/post
 */
export async function handleCommentPost(
  request: Request,
  env: Env,
  chatLink: string
): Promise<Response> {
  try {
    const body = await request.json() as CommentPostRequest;

    if (!body.token || !body.content?.joinUserToken || !body.content?.comment?.text) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // USER_TOKENを検証
    const userPayload = await requireUserToken(body.content.joinUserToken, env);
    if (!userPayload) {
      return createErrorResponse(401, 'Invalid user token');
    }

    // チャットが存在するか確認
    const chatDataStr = await env.KV.get(`chat:${chatLink}`);
    if (!chatDataStr) {
      return createErrorResponse(404, 'Chat not found');
    }

    const chatData: ChatData = JSON.parse(chatDataStr);

    // ユーザーのロールを取得
    const userRole = await getUserRole(chatLink, userPayload.userName, env);
    if (!userRole) {
      return createErrorResponse(403, 'User is not a member of this chat');
    }

    // 投稿権限をチェック
    if (!canPerformAction(userRole, 'post')) {
      return createErrorResponse(403, 'Insufficient permissions to post');
    }

    // コメントを作成
    const commentID = generateUUID();
    const comment: CommentData = {
      commentID,
      chatLink,
      userName: userPayload.userName,
      text: body.content.comment.text,
      commentedTime: getCurrentTimestamp(),
      reaction: {},
      deleted: false,
    };

    // KVに保存
    await env.KV.put(`comment:${commentID}`, JSON.stringify(comment));
    await env.KV.put(`chat:${chatLink}:comment:${commentID}`, commentID);

    // チャットの最終更新時刻とコメント数を更新
    chatData.recent = getCurrentTimestamp();
    chatData.commentCount = (chatData.commentCount || 0) + 1;
    chatData.updatedAt = Date.now();
    await env.KV.put(`chat:${chatLink}`, JSON.stringify(chatData));

    const response: APIResponse = {
      statusCode: 201,
      content: {
        commentID,
        text: comment.text,
        commentedTime: comment.commentedTime,
        userName: comment.userName,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Comment post error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * コメント編集 - POST /chat/:chatLink/comment/edit
 */
export async function handleCommentEdit(
  request: Request,
  env: Env,
  chatLink: string
): Promise<Response> {
  try {
    const body = await request.json() as CommentEditRequest;

    if (!body.token || !body.content?.sendUserToken || !body.content?.commentID || !body.content?.edited) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // USER_TOKENを検証
    const userPayload = await requireUserToken(body.content.sendUserToken, env);
    if (!userPayload) {
      return createErrorResponse(401, 'Invalid user token');
    }

    // コメントを取得
    const commentDataStr = await env.KV.get(`comment:${body.content.commentID}`);
    if (!commentDataStr) {
      return createErrorResponse(404, 'Comment not found');
    }

    const comment: CommentData = JSON.parse(commentDataStr);

    // 削除済みコメントは編集不可
    if (comment.deleted) {
      return createErrorResponse(410, 'Comment has been deleted');
    }

    // ユーザーのロールを取得
    const userRole = await getUserRole(chatLink, userPayload.userName, env);
    if (!userRole) {
      return createErrorResponse(403, 'User is not a member of this chat');
    }

    // 編集権限をチェック（自分のコメントのみ編集可能）
    if (comment.userName !== userPayload.userName) {
      return createErrorResponse(403, 'You can only edit your own comments');
    }

    if (!canPerformAction(userRole, 'edit')) {
      return createErrorResponse(403, 'Insufficient permissions to edit');
    }

    // コメントを更新
    comment.text = body.content.edited;
    comment.editedTime = getCurrentTimestamp();

    // KVに保存
    await env.KV.put(`comment:${body.content.commentID}`, JSON.stringify(comment));

    const response: APIResponse = {
      statusCode: 200,
      content: {
        commentID: comment.commentID,
        text: comment.text,
        editedTime: comment.editedTime,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Comment edit error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * コメント削除 - POST /chat/:chatLink/del/:commentId
 */
export async function handleCommentDelete(
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

    // すでに削除済み
    if (comment.deleted) {
      return createErrorResponse(410, 'Comment already deleted');
    }

    // ユーザーのロールを取得
    const userRole = await getUserRole(chatLink, userPayload.userName, env);
    if (!userRole) {
      return createErrorResponse(403, 'User is not a member of this chat');
    }

    // 削除権限をチェック（自分のコメントまたはmanager/owner）
    const canDelete =
      comment.userName === userPayload.userName ||
      userRole === 'manager' ||
      userRole === 'owner';

    if (!canDelete || !canPerformAction(userRole, 'delete')) {
      return createErrorResponse(403, 'Insufficient permissions to delete');
    }

    // コメントを論理削除
    comment.deleted = true;
    comment.text = '[削除されました]';

    // KVに保存
    await env.KV.put(`comment:${commentId}`, JSON.stringify(comment));

    // チャットのコメント数を更新
    const chatDataStr = await env.KV.get(`chat:${chatLink}`);
    if (chatDataStr) {
      const chatData: ChatData = JSON.parse(chatDataStr);
      chatData.commentCount = Math.max((chatData.commentCount || 0) - 1, 0);
      chatData.updatedAt = Date.now();
      await env.KV.put(`chat:${chatLink}`, JSON.stringify(chatData));
    }

    const response: APIResponse = {
      statusCode: 200,
      content: 'Comment deleted successfully',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Comment delete error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * コメント取得 - GET /chat/:chatLink/comments
 */
export async function handleCommentsGet(
  request: Request,
  env: Env,
  chatLink: string
): Promise<Response> {
  try {
    // チャットが存在するか確認
    const chatDataStr = await env.KV.get(`chat:${chatLink}`);
    if (!chatDataStr) {
      return createErrorResponse(404, 'Chat not found');
    }

    // コメント一覧を取得
    const commentKeys = await env.KV.list({ prefix: `chat:${chatLink}:comment:` });
    const comments: { [commentId: string]: any } = {};

    for (const key of commentKeys.keys) {
      const commentId = await env.KV.get(key.name);
      if (commentId) {
        const commentDataStr = await env.KV.get(`comment:${commentId}`);
        if (commentDataStr) {
          const comment: CommentData = JSON.parse(commentDataStr);

          // 削除されていないコメントのみ返す
          if (!comment.deleted) {
            comments[comment.commentID] = {
              text: comment.text,
              commentedTime: comment.commentedTime,
              userName: comment.userName,
              reaction: comment.reaction,
              editedTime: comment.editedTime,
            };
          }
        }
      }
    }

    const response: APIResponse = {
      statusCode: 200,
      content: { comments },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Comments get error:', error);
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
