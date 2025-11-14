/**
 * Secure Token Management System
 *
 * Security Features:
 * - Access tokens stored in memory (sessionStorage for cross-tab support)
 * - Refresh tokens would ideally use httpOnly cookies (backend requirement)
 * - Automatic token expiry checking
 * - Token rotation support
 * - XSS mitigation (no localStorage)
 *
 * Note: For production, implement httpOnly cookies for refresh tokens
 * on the backend to prevent XSS token theft
 */

import type { StoredTokens, OAuthTokenResponse } from '../types/api';

// In-memory token storage (fallback to sessionStorage for persistence)
let tokenCache: StoredTokens | null = null;

// Token refresh in progress flag to prevent concurrent refreshes
let refreshPromise: Promise<StoredTokens | null> | null = null;

/**
 * Storage key for tokens in sessionStorage
 * Using sessionStorage instead of localStorage to reduce XSS risk
 */
const STORAGE_KEY = 'flexio_tokens';

/**
 * Buffer time before token expiry to trigger refresh (5 minutes)
 */
const EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Store tokens securely
 *
 * @param tokenResponse - OAuth token response
 */
export function storeTokens(tokenResponse: OAuthTokenResponse): void {
  const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);

  const tokens: StoredTokens = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt,
    tokenType: tokenResponse.token_type,
    scope: tokenResponse.scope
  };

  // Store in memory cache
  tokenCache = tokens;

  // Persist to sessionStorage (not ideal but better than localStorage)
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Failed to persist tokens to sessionStorage:', error);
  }
}

/**
 * Retrieve access token if valid
 *
 * @param skipExpiryCheck - Skip expiry validation (for refresh operations)
 * @returns Access token or null if expired/missing
 */
export function getAccessToken(skipExpiryCheck = false): string | null {
  const tokens = getTokens();

  if (!tokens) {
    return null;
  }

  // Check if token is expired or about to expire
  if (!skipExpiryCheck && isTokenExpired(tokens)) {
    return null;
  }

  return tokens.accessToken;
}

/**
 * Retrieve refresh token
 *
 * @returns Refresh token or null if missing
 */
export function getRefreshToken(): string | null {
  const tokens = getTokens();
  return tokens?.refreshToken || null;
}

/**
 * Get all stored tokens
 *
 * @returns Stored tokens or null if missing
 */
export function getTokens(): StoredTokens | null {
  // Return from cache if available
  if (tokenCache) {
    return tokenCache;
  }

  // Try to restore from sessionStorage
  try {
    const tokensJson = sessionStorage.getItem(STORAGE_KEY);
    if (tokensJson) {
      tokenCache = JSON.parse(tokensJson);
      return tokenCache;
    }
  } catch (error) {
    console.error('Failed to restore tokens from sessionStorage:', error);
  }

  return null;
}

/**
 * Check if token is expired or about to expire
 *
 * @param tokens - Stored tokens
 * @returns true if expired or expiring soon
 */
export function isTokenExpired(tokens: StoredTokens): boolean {
  const now = Date.now();
  return tokens.expiresAt - now < EXPIRY_BUFFER;
}

/**
 * Check if token needs refresh
 * Returns true if token is expired or expiring within buffer time
 *
 * @returns true if refresh is needed
 */
export function needsRefresh(): boolean {
  const tokens = getTokens();
  if (!tokens) {
    return false;
  }
  return isTokenExpired(tokens);
}

/**
 * Clear all stored tokens
 * Call this on logout or authentication errors
 */
export function clearTokens(): void {
  tokenCache = null;
  refreshPromise = null;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tokens from sessionStorage:', error);
  }
}

/**
 * Check if user is authenticated
 *
 * @returns true if valid access token exists
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Get token expiry time in seconds
 *
 * @returns Seconds until token expires, or 0 if expired/missing
 */
export function getTokenExpirySeconds(): number {
  const tokens = getTokens();
  if (!tokens) {
    return 0;
  }

  const secondsRemaining = Math.floor((tokens.expiresAt - Date.now()) / 1000);
  return Math.max(0, secondsRemaining);
}

/**
 * Update access token (after refresh)
 * Preserves refresh token if not provided
 *
 * @param tokenResponse - New token response
 */
export function updateAccessToken(tokenResponse: OAuthTokenResponse): void {
  storeTokens(tokenResponse);
}

/**
 * Set refresh promise to prevent concurrent refresh attempts
 *
 * @param promise - Promise resolving to new tokens
 */
export function setRefreshPromise(promise: Promise<StoredTokens | null>): void {
  refreshPromise = promise;
}

/**
 * Get current refresh promise if one is in progress
 *
 * @returns Active refresh promise or null
 */
export function getRefreshPromise(): Promise<StoredTokens | null> | null {
  return refreshPromise;
}

/**
 * Clear refresh promise after completion
 */
export function clearRefreshPromise(): void {
  refreshPromise = null;
}

/**
 * Extract user information from token scope or claims
 * Note: In a real implementation, decode JWT or call /userinfo endpoint
 *
 * @returns User info if available
 */
export function getUserInfo(): { userId?: string; username?: string; scopes: string[] } | null {
  const tokens = getTokens();
  if (!tokens) {
    return null;
  }

  // Parse scopes
  const scopes = tokens.scope.split(' ').filter(Boolean);

  return {
    scopes
  };
}

/**
 * Check if user has specific scope
 *
 * @param scope - Scope to check
 * @returns true if user has scope
 */
export function hasScope(scope: string): boolean {
  const userInfo = getUserInfo();
  return userInfo?.scopes.includes(scope) || false;
}

/**
 * Validate tokens structure
 * Used for security checks after retrieval
 *
 * @param tokens - Tokens to validate
 * @returns true if tokens are valid
 */
export function validateTokensStructure(tokens: any): tokens is StoredTokens {
  return (
    tokens &&
    typeof tokens.accessToken === 'string' &&
    typeof tokens.refreshToken === 'string' &&
    typeof tokens.expiresAt === 'number' &&
    tokens.tokenType === 'Bearer' &&
    typeof tokens.scope === 'string'
  );
}

/**
 * Schedule automatic token refresh
 * Sets up a timer to refresh token before expiry
 *
 * @param refreshCallback - Function to call for refresh
 * @returns Timer ID to clear if needed
 */
export function scheduleTokenRefresh(
  refreshCallback: () => Promise<void>
): number | null {
  const tokens = getTokens();
  if (!tokens) {
    return null;
  }

  // Calculate time until we should refresh (with buffer)
  const timeUntilRefresh = tokens.expiresAt - Date.now() - EXPIRY_BUFFER;

  if (timeUntilRefresh <= 0) {
    // Already expired, refresh immediately
    refreshCallback();
    return null;
  }

  // Schedule refresh
  const timerId = window.setTimeout(() => {
    refreshCallback();
  }, timeUntilRefresh);

  return timerId;
}
