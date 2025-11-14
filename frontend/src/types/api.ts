/**
 * Flexio API Type Definitions
 * Complete TypeScript types for OAuth 2.0 and API integration
 */

// ============================================================================
// OAuth 2.0 Types
// ============================================================================

/**
 * OAuth 2.0 Authorization Request Parameters
 * RFC 6749 Section 4.1.1
 */
export interface OAuthAuthorizationRequest {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: 'S256';
}

/**
 * OAuth 2.0 Token Request Parameters
 * RFC 6749 Section 4.1.3
 */
export interface OAuthTokenRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret?: string;
  code_verifier?: string;
  refresh_token?: string;
}

/**
 * OAuth 2.0 Token Response
 * RFC 6749 Section 5.1
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/**
 * PKCE (Proof Key for Code Exchange) Parameters
 * RFC 7636
 */
export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * OAuth State Management
 */
export interface OAuthState {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  timestamp: number;
}

/**
 * Stored Token Information
 */
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
  scope: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API Response Wrapper
 */
export interface APIResponse<T> {
  data: T;
  message?: string;
  timestamp: number;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Error Response
 */
export interface APIErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
  status: number;
  timestamp: number;
}

// ============================================================================
// User Types
// ============================================================================

/**
 * User Profile
 */
export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  isAdmin: boolean;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

/**
 * User Creation Request
 */
export interface CreateUserRequest {
  username: string;
  email?: string;
  password?: string;
  displayName?: string;
}

/**
 * User Update Request
 */
export interface UpdateUserRequest {
  email?: string;
  displayName?: string;
  avatar?: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Dashboard Summary Data
 */
export interface DashboardSummary {
  totalChats: number;
  activeChats: number;
  totalComments: number;
  totalUsers: number;
  recentActivity: ActivityItem[];
}

/**
 * Dashboard Statistics
 */
export interface DashboardStats {
  chatsCreatedToday: number;
  commentsToday: number;
  activeUsersToday: number;
  popularChats: PopularChat[];
  trendingTopics: TrendingTopic[];
}

/**
 * Activity Item
 */
export interface ActivityItem {
  id: string;
  type: 'chat_created' | 'comment_posted' | 'user_joined';
  userId: string;
  username: string;
  chatId?: string;
  chatTitle?: string;
  timestamp: number;
}

/**
 * Popular Chat
 */
export interface PopularChat {
  id: string;
  title: string;
  commentCount: number;
  participantCount: number;
}

/**
 * Trending Topic
 */
export interface TrendingTopic {
  topic: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================================================
// Chat Types
// ============================================================================

/**
 * Chat Room
 */
export interface Chat {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorUsername: string;
  isPublic: boolean;
  isActive: boolean;
  participantCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

/**
 * Create Chat Request
 */
export interface CreateChatRequest {
  title: string;
  description?: string;
  isPublic: boolean;
  tags?: string[];
}

/**
 * Chat Comment
 */
export interface Comment {
  id: string;
  chatId: string;
  userId: string;
  username: string;
  content: string;
  parentId?: string;
  reactions: Reaction[];
  createdAt: number;
  updatedAt: number;
  isEdited: boolean;
  isDeleted: boolean;
}

/**
 * Post Comment Request
 */
export interface PostCommentRequest {
  chatId: string;
  content: string;
  parentId?: string;
}

/**
 * Reaction
 */
export interface Reaction {
  id: string;
  userId: string;
  username: string;
  emoji: string;
  timestamp: number;
}

// ============================================================================
// Settings Types
// ============================================================================

/**
 * User Settings
 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  showOnlineStatus: boolean;
  privacyLevel: 'public' | 'friends' | 'private';
}

/**
 * Update Settings Request
 */
export interface UpdateSettingsRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  showOnlineStatus?: boolean;
  privacyLevel?: 'public' | 'friends' | 'private';
}

// ============================================================================
// Admin Types
// ============================================================================

/**
 * Admin Dashboard Data
 */
export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalComments: number;
  pendingReports: number;
  systemHealth: SystemHealth;
}

/**
 * System Health
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  errorRate: number;
}

/**
 * User Management Query Parameters
 */
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
  sortBy?: 'username' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// HTTP Client Types
// ============================================================================

/**
 * HTTP Request Configuration
 */
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
}

/**
 * HTTP Client Configuration
 */
export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retryAttempts: number;
  retryDelay: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * API Error Class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Error Response with Validation
 */
export interface ValidationErrorResponse extends APIErrorResponse {
  errors: ValidationError[];
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

/**
 * Rate Limit Information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}
