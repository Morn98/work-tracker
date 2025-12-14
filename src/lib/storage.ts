/**
 * LocalStorage Layer for Client-Side Data
 * Handles settings and active timer ONLY
 * Projects and time entries are now stored in Supabase database
 */

import type { AppSettings, TimeEntry } from '../types';

// Storage keys for LocalStorage
const STORAGE_KEYS = {
  SETTINGS: 'work-tracker-settings',
  ACTIVE_TIMER: 'work-tracker-active-timer',
} as const;

// ============================================================================
// Active Timer (stays in localStorage - no sync between devices)
// ============================================================================

/**
 * Get the currently active timer from LocalStorage
 */
export const getActiveTimer = (): TimeEntry | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading active timer from localStorage:', error);
    return null;
  }
};

/**
 * Save the active timer to LocalStorage
 * Pass null to clear the active timer
 */
export const saveActiveTimer = (timer: TimeEntry | null): void => {
  try {
    if (timer) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TIMER, JSON.stringify(timer));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
    }
  } catch (error) {
    console.error('Error saving active timer to localStorage:', error);
  }
};

// ============================================================================
// Settings (stays in localStorage)
// ============================================================================

/**
 * Get application settings from LocalStorage
 */
export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { theme: 'system' };
  } catch (error) {
    console.error('Error reading settings from localStorage:', error);
    return { theme: 'system' };
  }
};

/**
 * Save application settings to LocalStorage
 */
export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
};

// ============================================================================
// Data Management
// ============================================================================

/**
 * Clear localStorage data (settings and active timer)
 * Note: This does NOT clear database data (projects and time entries)
 */
export const clearLocalStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};
