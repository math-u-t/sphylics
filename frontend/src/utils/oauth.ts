/**
 * OAuth 2.0 Authorization Code Flow with PKCE
 * RFC 6749 + RFC 7636 Implementation
 *
 * Security Features:
 * - PKCE (Proof Key for Code Exchange) for public clients
 * - State parameter for CSRF protection
 * - Secure token storage
 * - Automatic token refresh
 */

import type {
  OAuthTokenResponse,
  OAuthTokenRequest,
  APIErrorResponse
} from '../types/api';
import {
  generatePKCE,
  generateState,
  storeOAuthState,
  retrieveOAuthState,
  clearOAuthState
} from './pkce';
import {
  storeTokens,
  clearTokens,
  getRefreshToken,
  setRefreshPromise,
  getRefreshPromise,
  clearRefreshPromise
} from './tokenManager';

/**
 * OAuth Configuration
 */
interface OAuthConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scope: string;
}

/**
 * Get OAuth configuration from environment
 */
function getOAuthConfig(): OAuthConfig {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

  return {
    clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || 'flexio-web-client',
    authorizationEndpoint: `${baseURL}/oauth/authorize`,
    tokenEndpoint: `${baseURL}/oauth/token`,
    redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/oauth/callback`,
    scope: import.meta.env.VITE_OAUTH_SCOPE || 'read write admin'
  };
}

/**
 * Initiate OAuth 2.0 Authorization Code Flow with PKCE
 *
 * Steps:
 * 1. Generate PKCE parameters (code verifier & challenge)
 * 2. Generate state parameter for CSRF protection
 * 3. Store state and verifier in sessionStorage
 * 4. Redirect to authorization endpoint
 *
 * Security:
 * - Uses S256 (SHA-256) for PKCE challenge
 * - State has 128 bits of entropy
 * - All parameters validated
 *
 * @throws Error if crypto APIs not available
 */
export async function initiateOAuthFlow(): Promise<void> {
  try {
    const config = getOAuthConfig();

    // Generate PKCE parameters
    const pkce = await generatePKCE();

    // Generate state for CSRF protection
    const state = generateState();

    // Store state and code verifier for callback validation
    storeOAuthState(state, pkce.codeVerifier, config.redirectUri);

    // Build authorization URL
    const authUrl = new URL(config.authorizationEndpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', pkce.codeChallenge);
    authUrl.searchParams.set('code_challenge_method', pkce.codeChallengeMethod);

    console.log('Initiating OAuth flow:', {
      authorizationEndpoint: config.authorizationEndpoint,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scope: config.scope
    });

    // Redirect to authorization endpoint
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Failed to initiate OAuth flow:', error);
    clearOAuthState();
    throw new Error('Failed to start authentication. Please try again.');
  }
}

/**
 * Handle OAuth callback and exchange code for tokens
 *
 * Steps:
 * 1. Extract code and state from URL
 * 2. Validate state parameter
 * 3. Retrieve code verifier from storage
 * 4. Exchange authorization code for tokens
 * 5. Store tokens securely
 *
 * @param callbackUrl - Full callback URL with query parameters
 * @returns Token response if successful
 * @throws Error on validation or exchange failure
 */
export async function handleOAuthCallback(callbackUrl: string): Promise<OAuthTokenResponse> {
  try {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Check for authorization errors
    if (error) {
      clearOAuthState();
      throw new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
    }

    // Validate required parameters
    if (!code || !state) {
      clearOAuthState();
      throw new Error('Invalid callback: missing code or state parameter');
    }

    // Retrieve and validate OAuth state
    const oauthState = retrieveOAuthState(state);
    if (!oauthState) {
      throw new Error('Invalid or expired OAuth state. Possible CSRF attack.');
    }

    console.log('OAuth callback received, exchanging code for tokens');

    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(
      code,
      oauthState.codeVerifier,
      oauthState.redirectUri
    );

    // Store tokens securely
    storeTokens(tokenResponse);

    console.log('OAuth flow completed successfully');

    return tokenResponse;
  } catch (error) {
    console.error('OAuth callback error:', error);
    clearOAuthState();
    clearTokens();
    throw error;
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 *
 * @param code - Authorization code from callback
 * @param codeVerifier - PKCE code verifier
 * @param redirectUri - Redirect URI used in authorization
 * @returns Token response
 * @throws Error on exchange failure
 */
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthTokenResponse> {
  const config = getOAuthConfig();

  const tokenRequest: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier
  };

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(tokenRequest)
  });

  if (!response.ok) {
    const errorData: APIErrorResponse = await response.json();
    throw new Error(
      `Token exchange failed: ${errorData.error || 'Unknown error'} - ${
        errorData.error_description || ''
      }`
    );
  }

  const tokenResponse: OAuthTokenResponse = await response.json();

  // Validate token response
  if (!validateTokenResponse(tokenResponse)) {
    throw new Error('Invalid token response from server');
  }

  return tokenResponse;
}

/**
 * Refresh access token using refresh token
 *
 * Features:
 * - Prevents concurrent refresh requests
 * - Automatic token rotation
 * - Error handling with token cleanup
 *
 * @returns New token response if successful, null otherwise
 */
export async function refreshAccessToken(): Promise<OAuthTokenResponse | null> {
  // Check if refresh is already in progress
  const existingRefresh = getRefreshPromise();
  if (existingRefresh) {
    console.log('Token refresh already in progress, waiting...');
    await existingRefresh;
    return null;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.error('No refresh token available');
    return null;
  }

  const config = getOAuthConfig();

  // Create refresh promise to prevent concurrent requests
  const refreshPromise = (async () => {
    try {
      console.log('Refreshing access token...');

      const tokenRequest: Record<string, string> = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId
      };

      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(tokenRequest)
      });

      if (!response.ok) {
        const errorData: APIErrorResponse = await response.json();
        console.error('Token refresh failed:', errorData);

        // If refresh token is invalid/expired, clear all tokens
        if (response.status === 401 || response.status === 400) {
          clearTokens();
        }

        return null;
      }

      const tokenResponse: OAuthTokenResponse = await response.json();

      // Validate and store new tokens
      if (!validateTokenResponse(tokenResponse)) {
        console.error('Invalid token response during refresh');
        return null;
      }

      storeTokens(tokenResponse);
      console.log('Access token refreshed successfully');

      return tokenResponse;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    } finally {
      clearRefreshPromise();
    }
  })();

  setRefreshPromise(refreshPromise);
  const result = await refreshPromise;
  return result;
}

/**
 * Validate token response structure
 *
 * @param tokenResponse - Response to validate
 * @returns true if valid
 */
function validateTokenResponse(tokenResponse: any): tokenResponse is OAuthTokenResponse {
  return (
    tokenResponse &&
    typeof tokenResponse.access_token === 'string' &&
    typeof tokenResponse.token_type === 'string' &&
    tokenResponse.token_type === 'Bearer' &&
    typeof tokenResponse.expires_in === 'number' &&
    typeof tokenResponse.refresh_token === 'string' &&
    typeof tokenResponse.scope === 'string'
  );
}

/**
 * Logout user and clear all tokens
 *
 * @param redirectToLogin - Whether to redirect to login page
 */
export function logout(redirectToLogin = true): void {
  console.log('Logging out user');

  // Clear all tokens
  clearTokens();

  // Clear OAuth state
  clearOAuthState();

  // Optionally redirect to login
  if (redirectToLogin) {
    window.location.href = '/login';
  }
}

/**
 * Check if OAuth is properly configured
 *
 * @returns true if configuration is valid
 */
export function isOAuthConfigured(): boolean {
  try {
    const config = getOAuthConfig();
    return !!(
      config.clientId &&
      config.authorizationEndpoint &&
      config.tokenEndpoint &&
      config.redirectUri
    );
  } catch {
    return false;
  }
}
