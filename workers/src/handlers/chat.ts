/**
 * Chat API Handlers
 * チャットルーム作成・管理API
 */

import {
  Env,
  ChatData,
  ChatCreateRequest,
  ChatUpdateRequest,
  ChatDeleteRequest,
  ChatResponse,
  APIResponse
} from '../types';

/**
 * チャット作成 - POST /chat/new
 */
export async function handleChatCreate(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as ChatCreateRequest;

    // バリデーション
    if (!body.token || !body.content) {
      return createErrorResponse(400, 'Missing required fields: token, content');
    }

    const { title, about, tag, link } = body.content;

    if (!title || !about || !tag || !link) {
      return createErrorResponse(400, 'Missing required content fields: title, about, tag, link');
    }

    // linkの重複チェック
    const existingChat = await env.KV.get(`chat:${link}`);
    if (existingChat) {
      return createErrorResponse(409, 'Chat link already exists');
    }

    // linkのバリデーション (英数字、ハイフン、アンダースコアのみ)
    if (!/^[a-zA-Z0-9_-]+$/.test(link)) {
      return createErrorResponse(400, 'Invalid link format. Use only alphanumeric characters, hyphens, and underscores');
    }

    const now = Date.now();

    const chatData: ChatData = {
      link,
      title,
      about,
      tags: tag,
      adminToken: body.token,
      createdAt: now,
      updatedAt: now,
      participantCount: 0,
    };

    // KVに保存
    await env.KV.put(`chat:${link}`, JSON.stringify(chatData));

    const response: APIResponse<ChatResponse> = {
      statusCode: 201,
      content: {
        link: chatData.link,
        title: chatData.title,
        about: chatData.about,
        tags: chatData.tags,
        createdAt: chatData.createdAt,
        updatedAt: chatData.updatedAt,
        participantCount: chatData.participantCount,
        isAdmin: true,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat creation error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * チャット取得 - GET /chat/:link
 */
export async function handleChatGet(request: Request, env: Env, link: string): Promise<Response> {
  try {
    // トークンの取得（オプショナル）
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    const chatDataStr = await env.KV.get(`chat:${link}`);

    if (!chatDataStr) {
      return createErrorResponse(404, 'Chat not found');
    }

    const chatData: ChatData = JSON.parse(chatDataStr);

    const response: APIResponse<ChatResponse> = {
      statusCode: 200,
      content: {
        link: chatData.link,
        title: chatData.title,
        about: chatData.about,
        tags: chatData.tags,
        createdAt: chatData.createdAt,
        updatedAt: chatData.updatedAt,
        participantCount: chatData.participantCount,
        isAdmin: token ? chatData.adminToken === token : false,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat get error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * チャットリスト取得 - GET /chat/list
 */
export async function handleChatList(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const tag = url.searchParams.get('tag');

    // KVからチャット一覧を取得
    // 注意: KV list操作は本番環境では制限があるため、大規模な場合はDurable Objectsの使用を推奨
    const listResult = await env.KV.list({ prefix: 'chat:' });

    const chats: ChatResponse[] = [];

    for (const key of listResult.keys) {
      const chatDataStr = await env.KV.get(key.name);
      if (chatDataStr) {
        const chatData: ChatData = JSON.parse(chatDataStr);

        // タグフィルター
        if (tag && !chatData.tags.includes(tag)) {
          continue;
        }

        chats.push({
          link: chatData.link,
          title: chatData.title,
          about: chatData.about,
          tags: chatData.tags,
          createdAt: chatData.createdAt,
          updatedAt: chatData.updatedAt,
          participantCount: chatData.participantCount,
          isAdmin: token ? chatData.adminToken === token : false,
        });
      }
    }

    // 作成日時で降順ソート
    chats.sort((a, b) => b.createdAt - a.createdAt);

    // ページネーション
    const paginatedChats = chats.slice(offset, offset + limit);

    const response: APIResponse<{
      chats: ChatResponse[];
      total: number;
      limit: number;
      offset: number;
    }> = {
      statusCode: 200,
      content: {
        chats: paginatedChats,
        total: chats.length,
        limit,
        offset,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat list error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * チャット更新 - PUT /chat/update
 */
export async function handleChatUpdate(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as ChatUpdateRequest;

    // バリデーション
    if (!body.token || !body.link || !body.content) {
      return createErrorResponse(400, 'Missing required fields: token, link, content');
    }

    const chatDataStr = await env.KV.get(`chat:${body.link}`);

    if (!chatDataStr) {
      return createErrorResponse(404, 'Chat not found');
    }

    const chatData: ChatData = JSON.parse(chatDataStr);

    // 権限チェック
    if (chatData.adminToken !== body.token) {
      return createErrorResponse(403, 'Forbidden: Invalid admin token');
    }

    // データ更新
    if (body.content.title !== undefined) {
      chatData.title = body.content.title;
    }
    if (body.content.about !== undefined) {
      chatData.about = body.content.about;
    }
    if (body.content.tag !== undefined) {
      chatData.tags = body.content.tag;
    }
    chatData.updatedAt = Date.now();

    // KVに保存
    await env.KV.put(`chat:${body.link}`, JSON.stringify(chatData));

    const response: APIResponse<ChatResponse> = {
      statusCode: 200,
      content: {
        link: chatData.link,
        title: chatData.title,
        about: chatData.about,
        tags: chatData.tags,
        createdAt: chatData.createdAt,
        updatedAt: chatData.updatedAt,
        participantCount: chatData.participantCount,
        isAdmin: true,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat update error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * チャット削除 - DELETE /chat/delete
 */
export async function handleChatDelete(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as ChatDeleteRequest;

    // バリデーション
    if (!body.token || !body.link) {
      return createErrorResponse(400, 'Missing required fields: token, link');
    }

    const chatDataStr = await env.KV.get(`chat:${body.link}`);

    if (!chatDataStr) {
      return createErrorResponse(404, 'Chat not found');
    }

    const chatData: ChatData = JSON.parse(chatDataStr);

    // 権限チェック
    if (chatData.adminToken !== body.token) {
      return createErrorResponse(403, 'Forbidden: Invalid admin token');
    }

    // KVから削除
    await env.KV.delete(`chat:${body.link}`);

    const response: APIResponse<string> = {
      statusCode: 200,
      content: 'Chat deleted successfully',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat delete error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * 参加者数更新 - POST /chat/:link/participants
 */
export async function handleParticipantUpdate(request: Request, env: Env, link: string): Promise<Response> {
  try {
    const body = await request.json() as { action: 'join' | 'leave' };

    if (!body.action || !['join', 'leave'].includes(body.action)) {
      return createErrorResponse(400, 'Invalid action. Use "join" or "leave"');
    }

    const chatDataStr = await env.KV.get(`chat:${link}`);

    if (!chatDataStr) {
      return createErrorResponse(404, 'Chat not found');
    }

    const chatData: ChatData = JSON.parse(chatDataStr);

    // 参加者数を更新
    if (body.action === 'join') {
      chatData.participantCount++;
    } else if (body.action === 'leave' && chatData.participantCount > 0) {
      chatData.participantCount--;
    }

    chatData.updatedAt = Date.now();

    // KVに保存
    await env.KV.put(`chat:${link}`, JSON.stringify(chatData));

    const response: APIResponse<{ participantCount: number }> = {
      statusCode: 200,
      content: {
        participantCount: chatData.participantCount,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Participant update error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

/**
 * エラーレスポンス作成ヘルパー
 */
function createErrorResponse(statusCode: number, message: string): Response {
  const response: APIResponse<string> = {
    statusCode,
    content: message,
    error: message,
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
