/**
 * Settings API Service
 * Handles user settings and preferences with debouncing
 */

import { api } from '../utils/apiClient';
import type {
  APIResponse,
  UserSettings,
  UpdateSettingsRequest
} from '../types/api';

/**
 * Debounce timer for settings updates
 */
let debounceTimer: number | null = null;

/**
 * Get user settings
 *
 * @returns User settings
 */
export async function getSettings(): Promise<UserSettings> {
  const response = await api.get<APIResponse<UserSettings>>('/api/settings');
  return response.data;
}

/**
 * Update user settings
 *
 * @param settings - Settings to update
 * @returns Updated settings
 */
export async function updateSettings(
  settings: UpdateSettingsRequest
): Promise<UserSettings> {
  const response = await api.patch<APIResponse<UserSettings>>(
    '/api/settings',
    settings
  );
  return response.data;
}

/**
 * Update settings with debounce (500ms)
 * Use this for auto-saving settings as user types
 *
 * @param settings - Settings to update
 * @param callback - Optional callback on success
 * @param delay - Debounce delay in ms (default: 500)
 */
export function updateSettingsDebounced(
  settings: UpdateSettingsRequest,
  callback?: (settings: UserSettings) => void,
  delay = 500
): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(async () => {
    try {
      const updatedSettings = await updateSettings(settings);
      callback?.(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      debounceTimer = null;
    }
  }, delay);
}

/**
 * Cancel pending debounced settings update
 */
export function cancelSettingsUpdate(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

/**
 * Update theme setting
 *
 * @param theme - Theme preference
 * @returns Updated settings
 */
export async function updateTheme(
  theme: 'light' | 'dark' | 'auto'
): Promise<UserSettings> {
  return updateSettings({ theme });
}

/**
 * Update notification settings
 *
 * @param emailNotifications - Email notifications enabled
 * @param pushNotifications - Push notifications enabled
 * @returns Updated settings
 */
export async function updateNotifications(
  emailNotifications: boolean,
  pushNotifications: boolean
): Promise<UserSettings> {
  return updateSettings({ emailNotifications, pushNotifications });
}

/**
 * Update privacy level
 *
 * @param privacyLevel - Privacy level
 * @returns Updated settings
 */
export async function updatePrivacy(
  privacyLevel: 'public' | 'friends' | 'private'
): Promise<UserSettings> {
  return updateSettings({ privacyLevel });
}

/**
 * Reset settings to defaults
 *
 * @returns Default settings
 */
export async function resetSettings(): Promise<UserSettings> {
  const defaultSettings: UpdateSettingsRequest = {
    theme: 'auto',
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
    showOnlineStatus: true,
    privacyLevel: 'public'
  };

  return updateSettings(defaultSettings);
}
