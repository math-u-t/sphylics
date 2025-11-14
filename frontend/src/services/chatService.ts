/**
 * Chat API Service
 * Enhanced chat operations with optimistic updates
 */

import { api } from '../utils/apiClient';
import type {
  APIResponse,
  PaginatedResponse,
  Chat,
  CreateChatRequest,
  Comment,
  PostCommentRequest,
  Reaction
} from '../types/api';

/**
 * Get paginated list of chats
 *
 * @param page - Page number
 * @param limit - Items per page
 * @param query - Search query
 * @param type - Chat type filter
 * @returns Paginated chat list
 */
export async function getChatList(
  page = 1,
  limit = 20,
  query = '',
  type: 'all' | 'public' | 'private' = 'all'
): Promise<PaginatedResponse<Chat>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (query) params.set('query', query);
  if (type !== 'all') params.set('type', type);

  return api.get<PaginatedResponse<Chat>>(`/api/chats?${params.toString()}`);
}

/**
 * Get chat details by ID
 *
 * @param chatId - Chat ID
 * @returns Chat details with comments
 */
export async function getChat(chatId: string): Promise<Chat> {
  const response = await api.get<APIResponse<Chat>>(`/api/chats/${chatId}`);
  return response.data;
}

/**
 * Create new chat
 *
 * @param chatData - Chat creation data
 * @returns Created chat
 */
export async function createChat(chatData: CreateChatRequest): Promise<Chat> {
  const response = await api.post<APIResponse<Chat>>('/api/chats', chatData);
  return response.data;
}

/**
 * Update chat
 *
 * @param chatId - Chat ID
 * @param chatData - Update data
 * @returns Updated chat
 */
export async function updateChat(
  chatId: string,
  chatData: Partial<CreateChatRequest>
): Promise<Chat> {
  const response = await api.put<APIResponse<Chat>>(
    `/api/chats/${chatId}`,
    chatData
  );
  return response.data;
}

/**
 * Delete chat
 *
 * @param chatId - Chat ID
 */
export async function deleteChat(chatId: string): Promise<void> {
  await api.delete(`/api/chats/${chatId}`);
}

/**
 * Join chat room
 *
 * @param chatId - Chat ID
 * @returns Join token
 */
export async function joinChat(chatId: string): Promise<{ token: string }> {
  const response = await api.post<APIResponse<{ token: string }>>(
    `/api/chats/${chatId}/join`
  );
  return response.data;
}

/**
 * Leave chat room
 *
 * @param chatId - Chat ID
 */
export async function leaveChat(chatId: string): Promise<void> {
  await api.post(`/api/chats/${chatId}/leave`);
}

/**
 * Get chat comments
 *
 * @param chatId - Chat ID
 * @param page - Page number
 * @param limit - Items per page
 * @returns Paginated comments
 */
export async function getChatComments(
  chatId: string,
  page = 1,
  limit = 50
): Promise<PaginatedResponse<Comment>> {
  return api.get<PaginatedResponse<Comment>>(
    `/api/chats/${chatId}/comments?page=${page}&limit=${limit}`
  );
}

/**
 * Post comment to chat
 * Supports optimistic UI updates
 *
 * @param commentData - Comment data
 * @returns Created comment
 */
export async function postComment(
  commentData: PostCommentRequest
): Promise<Comment> {
  const response = await api.post<APIResponse<Comment>>(
    `/api/chats/${commentData.chatId}/comments`,
    commentData
  );
  return response.data;
}

/**
 * Edit comment
 *
 * @param chatId - Chat ID
 * @param commentId - Comment ID
 * @param content - Updated content
 * @returns Updated comment
 */
export async function editComment(
  chatId: string,
  commentId: string,
  content: string
): Promise<Comment> {
  const response = await api.put<APIResponse<Comment>>(
    `/api/chats/${chatId}/comments/${commentId}`,
    { content }
  );
  return response.data;
}

/**
 * Delete comment
 *
 * @param chatId - Chat ID
 * @param commentId - Comment ID
 */
export async function deleteComment(
  chatId: string,
  commentId: string
): Promise<void> {
  await api.delete(`/api/chats/${chatId}/comments/${commentId}`);
}

/**
 * Add reaction to comment
 *
 * @param chatId - Chat ID
 * @param commentId - Comment ID
 * @param emoji - Reaction emoji
 * @returns Updated reactions
 */
export async function addReaction(
  chatId: string,
  commentId: string,
  emoji: string
): Promise<Reaction[]> {
  const response = await api.post<APIResponse<Reaction[]>>(
    `/api/chats/${chatId}/comments/${commentId}/reactions`,
    { emoji }
  );
  return response.data;
}

/**
 * Remove reaction from comment
 *
 * @param chatId - Chat ID
 * @param commentId - Comment ID
 * @param reactionId - Reaction ID
 */
export async function removeReaction(
  chatId: string,
  commentId: string,
  reactionId: string
): Promise<void> {
  await api.delete(
    `/api/chats/${chatId}/comments/${commentId}/reactions/${reactionId}`
  );
}

/**
 * Search chats
 *
 * @param query - Search query
 * @param limit - Maximum results
 * @returns Matching chats
 */
export async function searchChats(query: string, limit = 20): Promise<Chat[]> {
  const response = await api.get<APIResponse<Chat[]>>(
    `/api/chats/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return response.data;
}

/**
 * Get user's chats
 *
 * @param userId - User ID (optional, defaults to current user)
 * @returns User's chats
 */
export async function getUserChats(userId?: string): Promise<Chat[]> {
  const endpoint = userId ? `/api/users/${userId}/chats` : '/api/users/me/chats';
  const response = await api.get<APIResponse<Chat[]>>(endpoint);
  return response.data;
}

/**
 * Get trending chats
 *
 * @param limit - Maximum results
 * @returns Trending chats
 */
export async function getTrendingChats(limit = 10): Promise<Chat[]> {
  const response = await api.get<APIResponse<Chat[]>>(
    `/api/chats/trending?limit=${limit}`
  );
  return response.data;
}
