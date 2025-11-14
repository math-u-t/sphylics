/**
 * Flexio API Client
 * Workers APIとの統合
 */

// API Base URL - 環境変数から取得または開発用デフォルト
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

/**
 * API エラークラス
 */
export class APIError extends Error {
  constructor(message, statusCode, content) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.content = content;
  }
}

/**
 * 汎用 API リクエスト関数
 */
async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, headers = {}, requireAuth = false } = options;

  // ヘッダーの設定
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 認証トークンの追加
  if (requireAuth) {
    const token = getServiceToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // リクエストオプション
  const requestOptions = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    const data = await response.json();

    // エラーレスポンスの処理
    if (data.statusCode >= 400) {
      throw new APIError(data.error || 'API Error', data.statusCode, data.content);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // ネットワークエラーなどの場合
    throw new APIError('Network Error', 0, error.message);
  }
}

/**
 * トークン管理
 */

// サービストークンの取得
export function getServiceToken() {
  return localStorage.getItem('flexio_service_token');
}

// サービストークンの保存
export function setServiceToken(token) {
  localStorage.setItem('flexio_service_token', token);
}

// サービストークンの削除
export function clearServiceToken() {
  localStorage.removeItem('flexio_service_token');
}

/**
 * OAuth認証
 */

// 認証URLの取得（未実装 - 現在はlocalStorageのみ）
export async function getAuthorizationUrl() {
  // TODO: OAuth フローの実装
  console.warn('OAuth not implemented yet');
  return null;
}

/**
 * チャット API
 */

// チャット一覧の取得
export async function getChatList(query = '', type = 'all') {
  try {
    const response = await apiRequest('/chat/list', {
      method: 'POST',
      body: {
        token: getServiceToken() || '',
        content: { query, type },
      },
      requireAuth: false,
    });
    return response.content;
  } catch (error) {
    console.error('Failed to fetch chat list:', error);
    // フォールバック: localStorageから取得
    return getFallbackChatList();
  }
}

// チャットの作成
export async function createChat(chatData) {
  try {
    const { title, about, tags, link } = chatData;
    const response = await apiRequest('/chat/new', {
      method: 'POST',
      body: {
        token: getServiceToken() || '',
        content: {
          title,
          about,
          tag: tags,
          link,
        },
      },
      requireAuth: false,
    });
    return response.content;
  } catch (error) {
    console.error('Failed to create chat:', error);
    // フォールバック: localStorageに保存
    return saveFallbackChat(chatData);
  }
}

// チャット詳細の取得
export async function getChat(chatLink) {
  try {
    const response = await apiRequest(`/chat/${chatLink}`, {
      method: 'GET',
    });
    return response.content;
  } catch (error) {
    console.error('Failed to fetch chat:', error);
    // フォールバック: localStorageから取得
    return getFallbackChat(chatLink);
  }
}

// チャットに参加
export async function joinChat(chatLink, userName) {
  try {
    const response = await apiRequest(`/chat/${chatLink}/join`, {
      method: 'POST',
      body: {
        token: getServiceToken() || '',
        content: { userName },
      },
    });
    return response.content;
  } catch (error) {
    console.error('Failed to join chat:', error);
    // フォールバック: localStorageに保存
    return saveFallbackJoin(chatLink, userName);
  }
}

/**
 * コメント API
 */

// コメントの投稿
export async function postComment(chatLink, userToken, text) {
  try {
    const response = await apiRequest(`/chat/${chatLink}/post`, {
      method: 'POST',
      body: {
        token: getServiceToken() || '',
        content: {
          joinUserToken: userToken,
          comment: { text },
        },
      },
    });
    return response.content;
  } catch (error) {
    console.error('Failed to post comment:', error);
    // フォールバック: localStorageに保存
    return saveFallbackComment(chatLink, text);
  }
}

// コメントの編集
export async function editComment(chatLink, commentID, text, userToken) {
  try {
    const response = await apiRequest(`/chat/${chatLink}/comment/edit`, {
      method: 'POST',
      body: {
        token: getServiceToken() || '',
        content: {
          sendUserToken: userToken,
          commentID,
          edited: text,
        },
      },
    });
    return response.content;
  } catch (error) {
    console.error('Failed to edit comment:', error);
    throw error;
  }
}

// コメントの削除
export async function deleteComment(chatLink, commentID, userToken) {
  try {
    const response = await apiRequest(`/chat/${chatLink}/comment/del`, {
      method: 'POST',
      body: {
        token: getServiceToken() || '',
        content: {
          sendUserToken: userToken,
          commentID,
        },
      },
    });
    return response.content;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
}

/**
 * リアクション API
 */

// リアクションの追加
export async function addReaction(chatLink, commentID, reactionName, userToken) {
  try {
    const response = await apiRequest(`/chat/${chatLink}/comment/reaction`, {
      method: 'POST',
      body: {
        token: getServiceToken() || '',
        content: {
          userToken,
          commentID,
          reactionName,
        },
      },
    });
    return response.content;
  } catch (error) {
    console.error('Failed to add reaction:', error);
    throw error;
  }
}

/**
 * フォールバック機能（API未接続時）
 * 既存のlocalStorage実装との互換性を保つ
 */

function getFallbackChatList() {
  const chats = JSON.parse(localStorage.getItem('flexio_chats') || '[]');
  const chatMap = {};
  chats.forEach(chat => {
    chatMap[chat.link] = {
      title: chat.title,
      about: chat.about,
      tag: chat.tags || [],
      recent: chat.createdAt || new Date().toISOString(),
      authority: {
        blocked: [],
        audience: [],
        entrant: [],
        manager: [],
        owner: [chat.owner || 'anonymous'],
      },
    };
  });
  return { chat: chatMap };
}

function saveFallbackChat(chatData) {
  const chats = JSON.parse(localStorage.getItem('flexio_chats') || '[]');
  const newChat = {
    ...chatData,
    createdAt: new Date().toISOString(),
    messages: [],
  };
  chats.push(newChat);
  localStorage.setItem('flexio_chats', JSON.stringify(chats));
  return newChat;
}

function getFallbackChat(chatLink) {
  const chats = JSON.parse(localStorage.getItem('flexio_chats') || '[]');
  const chat = chats.find(c => c.link === chatLink);
  if (!chat) {
    throw new APIError('Chat not found', 404, 'Chat does not exist');
  }

  // コメントを変換
  const commentMap = {};
  (chat.messages || []).forEach(msg => {
    commentMap[msg.id || Math.random().toString(36)] = {
      text: msg.text,
      commentedTime: msg.timestamp || new Date().toISOString(),
      userName: msg.userName || 'anonymous',
      reaction: {},
    };
  });

  return {
    chat: {
      comment: commentMap,
      information: {
        title: chat.title,
        about: chat.about,
        tag: chat.tags || [],
        recent: chat.createdAt || new Date().toISOString(),
        authority: {
          blocked: [],
          audience: [],
          entrant: [],
          manager: [],
          owner: [chat.owner || 'anonymous'],
        },
      },
    },
  };
}

function saveFallbackJoin(chatLink, userName) {
  // localStorageにユーザー参加情報を保存
  const userToken = `user_${chatLink}_${userName}_${Date.now()}`;
  localStorage.setItem(`flexio_user_${chatLink}`, userName);
  return { userToken };
}

function saveFallbackComment(chatLink, text) {
  const chats = JSON.parse(localStorage.getItem('flexio_chats') || '[]');
  const chat = chats.find(c => c.link === chatLink);
  if (!chat) {
    throw new APIError('Chat not found', 404, 'Chat does not exist');
  }

  const userName = localStorage.getItem(`flexio_user_${chatLink}`) || 'anonymous';
  const newMessage = {
    id: Math.random().toString(36).substr(2, 9),
    text,
    userName,
    timestamp: new Date().toISOString(),
  };

  if (!chat.messages) {
    chat.messages = [];
  }
  chat.messages.push(newMessage);
  localStorage.setItem('flexio_chats', JSON.stringify(chats));

  return { commentID: newMessage.id };
}

export default {
  // Auth
  getServiceToken,
  setServiceToken,
  clearServiceToken,
  getAuthorizationUrl,

  // Chat
  getChatList,
  createChat,
  getChat,
  joinChat,

  // Comment
  postComment,
  editComment,
  deleteComment,

  // Reaction
  addReaction,
};
