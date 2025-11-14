/**
 * Token Manager Tests
 * Secure token storage and management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  storeTokens,
  getAccessToken,
  getRefreshToken,
  getTokens,
  isTokenExpired,
  needsRefresh,
  clearTokens,
  isAuthenticated,
  getTokenExpirySeconds,
  hasScope
} from '../utils/tokenManager';
import type { OAuthTokenResponse } from '../types/api';

describe('Token Manager', () => {
  const mockTokenResponse: OAuthTokenResponse = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'read write'
  };

  beforeEach(() => {
    clearTokens();
    sessionStorage.clear();
  });

  describe('storeTokens', () => {
    it('should store tokens', () => {
      storeTokens(mockTokenResponse);

      const tokens = getTokens();
      expect(tokens).not.toBeNull();
      expect(tokens!.accessToken).toBe(mockTokenResponse.access_token);
      expect(tokens!.refreshToken).toBe(mockTokenResponse.refresh_token);
      expect(tokens!.tokenType).toBe('Bearer');
      expect(tokens!.scope).toBe(mockTokenResponse.scope);
    });

    it('should calculate correct expiry time', () => {
      const beforeStore = Date.now();
      storeTokens(mockTokenResponse);
      const afterStore = Date.now();

      const tokens = getTokens();
      expect(tokens).not.toBeNull();

      const expectedExpiry = beforeStore + (mockTokenResponse.expires_in * 1000);
      expect(tokens!.expiresAt).toBeGreaterThanOrEqual(expectedExpiry);
      expect(tokens!.expiresAt).toBeLessThanOrEqual(afterStore + (mockTokenResponse.expires_in * 1000));
    });

    it('should persist tokens to sessionStorage', () => {
      storeTokens(mockTokenResponse);

      const stored = sessionStorage.getItem('flexio_tokens');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.accessToken).toBe(mockTokenResponse.access_token);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token if valid', () => {
      storeTokens(mockTokenResponse);

      const token = getAccessToken();
      expect(token).toBe(mockTokenResponse.access_token);
    });

    it('should return null if token expired', () => {
      const expiredResponse = {
        ...mockTokenResponse,
        expires_in: -1 // Already expired
      };
      storeTokens(expiredResponse);

      const token = getAccessToken();
      expect(token).toBeNull();
    });

    it('should return null if no tokens stored', () => {
      const token = getAccessToken();
      expect(token).toBeNull();
    });

    it('should skip expiry check when requested', () => {
      const expiredResponse = {
        ...mockTokenResponse,
        expires_in: -1
      };
      storeTokens(expiredResponse);

      const token = getAccessToken(true);
      expect(token).toBe(mockTokenResponse.access_token);
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token', () => {
      storeTokens(mockTokenResponse);

      const token = getRefreshToken();
      expect(token).toBe(mockTokenResponse.refresh_token);
    });

    it('should return null if no tokens stored', () => {
      const token = getRefreshToken();
      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired tokens', () => {
      const tokens = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 1000,
        tokenType: 'Bearer' as const,
        scope: 'read'
      };

      expect(isTokenExpired(tokens)).toBe(true);
    });

    it('should detect tokens expiring soon (within buffer)', () => {
      const tokens = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + (4 * 60 * 1000), // 4 minutes (within 5min buffer)
        tokenType: 'Bearer' as const,
        scope: 'read'
      };

      expect(isTokenExpired(tokens)).toBe(true);
    });

    it('should accept valid tokens', () => {
      const tokens = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        tokenType: 'Bearer' as const,
        scope: 'read'
      };

      expect(isTokenExpired(tokens)).toBe(false);
    });
  });

  describe('needsRefresh', () => {
    it('should return true if token needs refresh', () => {
      const expiredResponse = {
        ...mockTokenResponse,
        expires_in: 60 // 1 minute (within buffer)
      };
      storeTokens(expiredResponse);

      expect(needsRefresh()).toBe(true);
    });

    it('should return false if token is valid', () => {
      storeTokens(mockTokenResponse);

      expect(needsRefresh()).toBe(false);
    });

    it('should return false if no tokens', () => {
      expect(needsRefresh()).toBe(false);
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens', () => {
      storeTokens(mockTokenResponse);

      clearTokens();

      expect(getTokens()).toBeNull();
      expect(sessionStorage.getItem('flexio_tokens')).toBeNull();
    });

    it('should make user unauthenticated', () => {
      storeTokens(mockTokenResponse);
      expect(isAuthenticated()).toBe(true);

      clearTokens();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if valid token exists', () => {
      storeTokens(mockTokenResponse);

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false if token expired', () => {
      const expiredResponse = {
        ...mockTokenResponse,
        expires_in: -1
      };
      storeTokens(expiredResponse);

      expect(isAuthenticated()).toBe(false);
    });

    it('should return false if no tokens', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getTokenExpirySeconds', () => {
    it('should return seconds until expiry', () => {
      storeTokens(mockTokenResponse);

      const seconds = getTokenExpirySeconds();
      expect(seconds).toBeGreaterThan(3500); // Should be close to 3600
      expect(seconds).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired tokens', () => {
      const expiredResponse = {
        ...mockTokenResponse,
        expires_in: -1
      };
      storeTokens(expiredResponse);

      expect(getTokenExpirySeconds()).toBe(0);
    });

    it('should return 0 if no tokens', () => {
      expect(getTokenExpirySeconds()).toBe(0);
    });
  });

  describe('hasScope', () => {
    it('should check if user has specific scope', () => {
      storeTokens(mockTokenResponse);

      expect(hasScope('read')).toBe(true);
      expect(hasScope('write')).toBe(true);
      expect(hasScope('admin')).toBe(false);
    });

    it('should return false if no tokens', () => {
      expect(hasScope('read')).toBe(false);
    });
  });

  describe('Token Restoration', () => {
    it('should restore tokens from sessionStorage', () => {
      storeTokens(mockTokenResponse);

      // Simulate page reload by clearing in-memory cache
      clearTokens();

      // Tokens should be restored from sessionStorage
      const token = getAccessToken();
      expect(token).toBe(mockTokenResponse.access_token);
    });
  });
});
