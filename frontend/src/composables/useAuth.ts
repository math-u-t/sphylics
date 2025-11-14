/**
 * Authentication Composable
 * Vue 3 Composition API for authentication state and actions
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  initiateOAuthFlow,
  handleOAuthCallback,
  logout as oauthLogout,
  isOAuthConfigured
} from '../utils/oauth';
import {
  isAuthenticated as checkAuth,
  getTokenExpirySeconds,
  clearTokens,
  scheduleTokenRefresh
} from '../utils/tokenManager';
import { getCurrentUser } from '../services/userService';
import type { User } from '../types/api';

/**
 * Global auth state (shared across components)
 */
const isAuthenticated = ref(false);
const currentUser = ref<User | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

/**
 * Token refresh timer
 */
let refreshTimer: number | null = null;

/**
 * Authentication composable
 */
export function useAuth() {
  const router = useRouter();

  /**
   * Computed properties
   */
  const isLoggedIn = computed(() => isAuthenticated.value);
  const user = computed(() => currentUser.value);
  const isAdmin = computed(() => currentUser.value?.isAdmin || false);
  const tokenExpiry = computed(() => getTokenExpirySeconds());
  const oauthConfigured = computed(() => isOAuthConfigured());

  /**
   * Initialize authentication state
   */
  async function init() {
    isLoading.value = true;
    error.value = null;

    try {
      // Check if user has valid token
      if (checkAuth()) {
        isAuthenticated.value = true;

        // Fetch current user profile
        await loadUser();

        // Schedule automatic token refresh
        setupTokenRefresh();
      } else {
        isAuthenticated.value = false;
        currentUser.value = null;
      }
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      error.value = err.message;
      isAuthenticated.value = false;
      currentUser.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Load current user profile
   */
  async function loadUser() {
    try {
      const user = await getCurrentUser();
      currentUser.value = user;
    } catch (err: any) {
      console.error('Failed to load user:', err);
      throw err;
    }
  }

  /**
   * Start OAuth login flow
   */
  async function login() {
    isLoading.value = true;
    error.value = null;

    try {
      await initiateOAuthFlow();
      // User will be redirected to authorization server
    } catch (err: any) {
      console.error('Login error:', err);
      error.value = err.message;
      isLoading.value = false;
    }
  }

  /**
   * Handle OAuth callback after redirect
   *
   * @param callbackUrl - Full callback URL with parameters
   */
  async function handleCallback(callbackUrl: string) {
    isLoading.value = true;
    error.value = null;

    try {
      // Exchange code for tokens
      await handleOAuthCallback(callbackUrl);

      // Set authenticated state
      isAuthenticated.value = true;

      // Load user profile
      await loadUser();

      // Schedule token refresh
      setupTokenRefresh();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      error.value = err.message;
      isAuthenticated.value = false;
      currentUser.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout user
   */
  function logout() {
    // Clear tokens
    clearTokens();

    // Clear refresh timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    // Reset state
    isAuthenticated.value = false;
    currentUser.value = null;
    error.value = null;

    // Redirect to login
    oauthLogout(true);
  }

  /**
   * Setup automatic token refresh
   */
  function setupTokenRefresh() {
    // Clear existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    // Schedule next refresh
    refreshTimer = scheduleTokenRefresh(async () => {
      try {
        console.log('Auto-refreshing token...');
        // Token refresh is handled by API client interceptor
        // Just reschedule the next refresh
        setupTokenRefresh();
      } catch (err) {
        console.error('Token refresh failed:', err);
        logout();
      }
    });
  }

  /**
   * Refresh user profile
   */
  async function refreshUser() {
    if (!isAuthenticated.value) return;

    isLoading.value = true;
    try {
      await loadUser();
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Check if user has specific permission
   *
   * @param permission - Permission to check
   */
  function hasPermission(permission: string): boolean {
    if (!currentUser.value) return false;

    // Admin has all permissions
    if (currentUser.value.isAdmin) return true;

    // Add custom permission logic here
    return false;
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Lifecycle hooks
   */
  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
  });

  return {
    // State
    isAuthenticated: isLoggedIn,
    user,
    isAdmin,
    isLoading,
    error,
    tokenExpiry,
    oauthConfigured,

    // Actions
    login,
    logout,
    handleCallback,
    refreshUser,
    hasPermission,
    clearError
  };
}
