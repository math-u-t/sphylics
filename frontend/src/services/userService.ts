/**
 * User Management API Service
 * Handles user CRUD operations and profile management
 */

import { api } from '../utils/apiClient';
import type {
  APIResponse,
  PaginatedResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams
} from '../types/api';

/**
 * Get paginated list of users with filters
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated user list
 */
export async function getUsers(
  params: UserQueryParams = {}
): Promise<PaginatedResponse<User>> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.role) queryParams.set('role', params.role);
  if (params.status) queryParams.set('status', params.status);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/users?${queryString}` : '/api/users';

  return api.get<PaginatedResponse<User>>(endpoint);
}

/**
 * Get user details by ID
 *
 * @param userId - User ID
 * @returns User details
 */
export async function getUser(userId: string): Promise<User> {
  const response = await api.get<APIResponse<User>>(`/api/users/${userId}`);
  return response.data;
}

/**
 * Get current authenticated user's profile
 *
 * @returns Current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<APIResponse<User>>('/api/users/me');
  return response.data;
}

/**
 * Create new user
 *
 * @param userData - User creation data
 * @returns Created user
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  const response = await api.post<APIResponse<User>>(
    '/api/users',
    userData
  );
  return response.data;
}

/**
 * Update user by ID
 *
 * @param userId - User ID
 * @param userData - Update data
 * @returns Updated user
 */
export async function updateUser(
  userId: string,
  userData: UpdateUserRequest
): Promise<User> {
  const response = await api.put<APIResponse<User>>(
    `/api/users/${userId}`,
    userData
  );
  return response.data;
}

/**
 * Update current user's profile
 *
 * @param userData - Update data
 * @returns Updated user profile
 */
export async function updateCurrentUser(
  userData: UpdateUserRequest
): Promise<User> {
  const response = await api.put<APIResponse<User>>(
    '/api/users/me',
    userData
  );
  return response.data;
}

/**
 * Delete user by ID
 *
 * @param userId - User ID
 */
export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/api/users/${userId}`);
}

/**
 * Deactivate user (soft delete)
 *
 * @param userId - User ID
 * @returns Updated user
 */
export async function deactivateUser(userId: string): Promise<User> {
  const response = await api.patch<APIResponse<User>>(
    `/api/users/${userId}/deactivate`
  );
  return response.data;
}

/**
 * Activate user
 *
 * @param userId - User ID
 * @returns Updated user
 */
export async function activateUser(userId: string): Promise<User> {
  const response = await api.patch<APIResponse<User>>(
    `/api/users/${userId}/activate`
  );
  return response.data;
}

/**
 * Search users by username or email
 *
 * @param query - Search query
 * @param limit - Maximum results
 * @returns List of matching users
 */
export async function searchUsers(
  query: string,
  limit = 10
): Promise<User[]> {
  const response = await api.get<APIResponse<User[]>>(
    `/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return response.data;
}
