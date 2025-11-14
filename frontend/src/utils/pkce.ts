/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * RFC 7636 Implementation
 *
 * Security: Uses cryptographically secure random generation
 * with 128 bits of entropy (minimum required)
 */

import type { PKCEParams } from '../types/api';

/**
 * Generate cryptographically secure random string
 * @param length - Length of the output string
 * @returns Base64URL-encoded random string
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Base64URL encoding (RFC 4648 Section 5)
 * URL-safe variant without padding
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...Array.from(buffer)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate SHA-256 hash of the input string
 * @param plain - Plain text to hash
 * @returns Base64URL-encoded hash
 */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Generate PKCE parameters (code verifier and code challenge)
 *
 * Security:
 * - Code verifier: 128 bits of entropy (43+ characters)
 * - Code challenge: SHA-256 hash of verifier
 * - Method: S256 (SHA-256, not plain)
 *
 * @returns PKCEParams with verifier and challenge
 */
export async function generatePKCE(): Promise<PKCEParams> {
  // Generate code verifier with sufficient entropy
  // RFC 7636 recommends 43-128 characters
  const codeVerifier = generateRandomString(32); // 32 bytes = 256 bits entropy

  // Generate code challenge using SHA-256
  const codeChallenge = await sha256(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

/**
 * Generate cryptographically secure state parameter
 * Minimum 128 bits of entropy for CSRF protection
 *
 * @returns Base64URL-encoded random state string
 */
export function generateState(): string {
  return generateRandomString(16); // 16 bytes = 128 bits
}

/**
 * Validate state parameter to prevent CSRF attacks
 *
 * @param receivedState - State from OAuth callback
 * @param expectedState - State stored before redirect
 * @returns true if states match
 */
export function validateState(receivedState: string, expectedState: string): boolean {
  if (!receivedState || !expectedState) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (receivedState.length !== expectedState.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < receivedState.length; i++) {
    result |= receivedState.charCodeAt(i) ^ expectedState.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Store OAuth state securely in sessionStorage
 * Used to validate the OAuth callback
 *
 * @param state - OAuth state parameter
 * @param codeVerifier - PKCE code verifier
 * @param redirectUri - Redirect URI used in OAuth flow
 */
export function storeOAuthState(
  state: string,
  codeVerifier: string,
  redirectUri: string
): void {
  const stateData = {
    state,
    codeVerifier,
    redirectUri,
    timestamp: Date.now()
  };

  sessionStorage.setItem('oauth_state', JSON.stringify(stateData));
}

/**
 * Retrieve and validate OAuth state from sessionStorage
 *
 * @param receivedState - State from OAuth callback
 * @returns OAuth state data if valid, null otherwise
 */
export function retrieveOAuthState(receivedState: string): {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  timestamp: number;
} | null {
  const stateJson = sessionStorage.getItem('oauth_state');
  if (!stateJson) {
    console.error('OAuth state not found in sessionStorage');
    return null;
  }

  try {
    const stateData = JSON.parse(stateJson);

    // Validate state matches
    if (!validateState(receivedState, stateData.state)) {
      console.error('OAuth state validation failed - possible CSRF attack');
      return null;
    }

    // Check state is not expired (max 10 minutes)
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - stateData.timestamp > maxAge) {
      console.error('OAuth state expired');
      return null;
    }

    return stateData;
  } catch (error) {
    console.error('Failed to parse OAuth state:', error);
    return null;
  } finally {
    // Always clear state after retrieval (single-use)
    sessionStorage.removeItem('oauth_state');
  }
}

/**
 * Clear OAuth state from sessionStorage
 * Call this on error or cancellation
 */
export function clearOAuthState(): void {
  sessionStorage.removeItem('oauth_state');
}
