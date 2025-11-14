/**
 * Unified HTTP Client with Automatic Token Refresh and Error Handling
 *
 * Features:
 * - Request/Response interceptors
 * - Automatic token refresh on 401
 * - Comprehensive error handling
 * - Rate limiting support
 * - Request retry logic
 * - Loading state management
 */

import type {
  APIResponse,
  PaginatedResponse,
  APIErrorResponse,
  RequestConfig,
  RateLimitInfo
} from '../types/api';
import { getAccessToken, needsRefresh, clearTokens } from './tokenManager';
import { refreshAccessToken, logout } from './oauth';

/**
 * API Base URL from environment
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

/**
 * Default request timeout (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Maximum retry attempts for failed requests
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * API Error Class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any,
    public rateLimitInfo?: RateLimitInfo
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Request queue for handling concurrent requests during token refresh
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * Process queued requests after token refresh
 */
function processQueue(error: any = null, token: string | null = null) {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse rate limit headers
 */
function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');
  const retryAfter = headers.get('Retry-After');

  if (limit || remaining || reset) {
    return {
      limit: limit ? parseInt(limit, 10) : 0,
      remaining: remaining ? parseInt(remaining, 10) : 0,
      reset: reset ? parseInt(reset, 10) : 0,
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined
    };
  }

  return undefined;
}

/**
 * Request interceptor
 * Adds authentication token and common headers
 */
function requestInterceptor(config: RequestConfig): RequestConfig {
  const headers = config.headers || {};

  // Add access token if required
  if (config.requiresAuth !== false) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  // Add timestamp
  headers['X-Request-Time'] = Date.now().toString();

  // Ensure Content-Type
  if (!headers['Content-Type'] && config.body) {
    headers['Content-Type'] = 'application/json';
  }

  return {
    ...config,
    headers
  };
}

/**
 * Core HTTP request function with interceptors
 */
async function request<T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  // Apply request interceptor
  const requestConfig = requestInterceptor(config);

  const {
    method = 'GET',
    headers = {},
    body,
    timeout = DEFAULT_TIMEOUT,
    retries = 0
  } = requestConfig;

  // Build request options
  const requestOptions: RequestInit = {
    method,
    headers: headers as HeadersInit
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...requestOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Handle response with interceptor
    return await responseInterceptor<T>(response, endpoint, config, retries);
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout', 408);
    }

    // Handle network errors with retry
    if (retries < MAX_RETRY_ATTEMPTS) {
      console.log(`Retrying request (${retries + 1}/${MAX_RETRY_ATTEMPTS})...`);
      await sleep(Math.pow(2, retries) * 1000); // Exponential backoff
      return request<T>(endpoint, { ...config, retries: retries + 1 });
    }

    throw new APIError('Network error', 0, 'NETWORK_ERROR', error.message);
  }
}

/**
 * Response interceptor
 * Handles errors, token refresh, and response parsing
 */
async function responseInterceptor<T>(
  response: Response,
  endpoint: string,
  originalConfig: RequestConfig,
  retries: number
): Promise<T> {
  const rateLimitInfo = parseRateLimitHeaders(response.headers);

  // Success responses (2xx)
  if (response.ok) {
    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    try {
      const data = await response.json();
      return data as T;
    } catch {
      // If JSON parsing fails, return empty object
      return {} as T;
    }
  }

  // Handle 401 Unauthorized - Token refresh
  if (response.status === 401 && originalConfig.requiresAuth !== false) {
    // Check if token refresh is needed
    if (needsRefresh() || getAccessToken() === null) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Retry original request with new token
          return request<T>(endpoint, { ...originalConfig, retries });
        });
      }

      isRefreshing = true;

      try {
        const tokenResponse = await refreshAccessToken();

        if (tokenResponse) {
          isRefreshing = false;
          processQueue(null, tokenResponse.access_token);

          // Retry original request with new token
          return request<T>(endpoint, { ...originalConfig, retries });
        } else {
          // Refresh failed, logout user
          isRefreshing = false;
          processQueue(new APIError('Token refresh failed', 401), null);
          logout(true);
          throw new APIError('Authentication failed', 401, 'TOKEN_REFRESH_FAILED');
        }
      } catch (error) {
        isRefreshing = false;
        processQueue(error, null);
        logout(true);
        throw error;
      }
    }

    // No refresh needed, just logout
    logout(true);
    throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
  }

  // Handle other error responses
  let errorData: APIErrorResponse;
  try {
    errorData = await response.json();
  } catch {
    errorData = {
      error: response.statusText || 'Unknown error',
      status: response.status,
      timestamp: Date.now()
    };
  }

  // Handle different error types
  switch (response.status) {
    case 400:
      throw new APIError(
        errorData.error || 'Bad request',
        400,
        'VALIDATION_ERROR',
        errorData.error_description
      );

    case 403:
      throw new APIError(
        errorData.error || 'Permission denied',
        403,
        'FORBIDDEN'
      );

    case 404:
      throw new APIError(
        errorData.error || 'Resource not found',
        404,
        'NOT_FOUND'
      );

    case 429:
      // Rate limiting - retry after specified time
      if (rateLimitInfo?.retryAfter && retries < MAX_RETRY_ATTEMPTS) {
        console.log(`Rate limited, retrying after ${rateLimitInfo.retryAfter}s...`);
        await sleep(rateLimitInfo.retryAfter * 1000);
        return request<T>(endpoint, { ...originalConfig, retries: retries + 1 });
      }

      throw new APIError(
        errorData.error || 'Too many requests',
        429,
        'RATE_LIMIT_EXCEEDED',
        errorData.error_description,
        rateLimitInfo
      );

    case 500:
    case 502:
    case 503:
    case 504:
      // Server errors - retry with exponential backoff
      if (retries < MAX_RETRY_ATTEMPTS) {
        console.log(`Server error, retrying (${retries + 1}/${MAX_RETRY_ATTEMPTS})...`);
        await sleep(Math.pow(2, retries) * 1000);
        return request<T>(endpoint, { ...originalConfig, retries: retries + 1 });
      }

      throw new APIError(
        errorData.error || 'Server error',
        response.status,
        'SERVER_ERROR',
        errorData.error_description
      );

    default:
      throw new APIError(
        errorData.error || 'Request failed',
        response.status,
        'UNKNOWN_ERROR',
        errorData.error_description
      );
  }
}

/**
 * HTTP method wrappers
 */
export const api = {
  get: <T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) =>
    request<T>(endpoint, { ...config, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) =>
    request<T>(endpoint, { ...config, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) =>
    request<T>(endpoint, { ...config, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    request<T>(endpoint, { ...config, method: 'DELETE' })
};

/**
 * Utility to handle API errors in components
 */
export function handleAPIError(error: any): string {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return error.details || 'Invalid input. Please check your data.';
      case 'UNAUTHORIZED':
        return 'Please log in to continue.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'RATE_LIMIT_EXCEEDED':
        return `Too many requests. Please try again in ${error.rateLimitInfo?.retryAfter || 60} seconds.`;
      case 'SERVER_ERROR':
        return 'Server error. Please try again later.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection.';
      default:
        return error.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

export default api;
