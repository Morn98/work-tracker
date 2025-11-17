/**
 * Unified LocalStorage data layer
 * Handles all data persistence for projects, sessions (time entries), and settings
 */

import type { Project, TimeEntry, AppSettings } from '../types';

// Storage keys for LocalStorage
const STORAGE_KEYS = {
  PROJECTS: 'work-tracker-projects',
  TIME_ENTRIES: 'work-tracker-time-entries',
  SESSIONS: 'work-tracker-sessions', // Alias for TIME_ENTRIES for compatibility
  SETTINGS: 'work-tracker-settings',
  ACTIVE_TIMER: 'work-tracker-active-timer',
} as const;

// ============================================================================
// Projects
// ============================================================================

/**
 * Get all projects from LocalStorage
 */
export const getProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading projects from localStorage:', error);
    return [];
  }
};

/**
 * Save a single project (creates new or updates existing)
 */
export const saveProject = (project: Project): void => {
  try {
    const projects = getProjects();
    const existingIndex = projects.findIndex((p) => p.id === project.id);

    if (existingIndex >= 0) {
      // Update existing project
      projects[existingIndex] = project;
    } else {
      // Add new project
      projects.push(project);
    }

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving project to localStorage:', error);
  }
};

/**
 * Save multiple projects at once
 */
export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving projects to localStorage:', error);
  }
};

/**
 * Delete a project by ID
 */
export const deleteProject = (id: string): void => {
  try {
    const projects = getProjects();
    const filteredProjects = projects.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filteredProjects));
  } catch (error) {
    console.error('Error deleting project from localStorage:', error);
  }
};

// ============================================================================
// Time Entries / Sessions
// ============================================================================

/**
 * Get all time entries (sessions) from LocalStorage
 * Note: Session is an alias for TimeEntry - they represent the same data
 */
export const getTimeEntries = (): TimeEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading time entries from localStorage:', error);
    return [];
  }
};

/**
 * Alias for getTimeEntries() for compatibility with Statistics page
 */
export const getSessions = (): TimeEntry[] => {
  return getTimeEntries();
};

/**
 * Save a single time entry (creates new or updates existing)
 */
export const saveTimeEntry = (entry: TimeEntry): void => {
  try {
    const entries = getTimeEntries();
    const existingIndex = entries.findIndex((e) => e.id === entry.id);

    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = entry;
    } else {
      // Add new entry
      entries.push(entry);
    }

    localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving time entry to localStorage:', error);
  }
};

/**
 * Save multiple time entries at once
 */
export const saveTimeEntries = (entries: TimeEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving time entries to localStorage:', error);
  }
};

/**
 * Alias for saveTimeEntry() for compatibility
 */
export const saveSession = (session: TimeEntry): void => {
  saveTimeEntry(session);
};

/**
 * Delete a time entry by ID
 */
export const deleteTimeEntry = (id: string): void => {
  try {
    const entries = getTimeEntries();
    const filteredEntries = entries.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(filteredEntries));
  } catch (error) {
    console.error('Error deleting time entry from localStorage:', error);
  }
};

/**
 * Alias for deleteTimeEntry() for compatibility
 */
export const deleteSession = (id: string): void => {
  deleteTimeEntry(id);
};

// ============================================================================
// Active Timer
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
// Settings
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
 * Clear all data from LocalStorage
 * WARNING: This permanently deletes all projects, sessions, and settings
 */
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.TIME_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
  } catch (error) {
    console.error('Error clearing data from localStorage:', error);
  }
};

// ============================================================================
// Legacy storage object (for backward compatibility)
// ============================================================================

/**
 * Legacy storage object for backward compatibility
 * @deprecated Use individual functions instead
 */
export const storage = {
  getProjects,
  saveProjects,
  getTimeEntries,
  saveTimeEntries,
  getSettings,
  saveSettings,
  getActiveTimer,
  saveActiveTimer,
};

// Export Session type alias for compatibility
export type Session = TimeEntry;
