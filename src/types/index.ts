export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string; // Now required (use DEFAULT_PROJECT_COLOR as fallback)
  createdAt: number; // Timestamp when project was created
  updatedAt: number; // Timestamp when project was last modified
  isArchived?: boolean; // Optional: soft delete support
}

export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: number;
  endTime?: number;
  description?: string;
  duration?: number; // in seconds
  createdAt: number; // Timestamp when entry was created
  updatedAt: number; // Timestamp when entry was last modified
  isManual?: boolean; // Whether this was manually entered or from timer
}

/**
 * Active timer data for multi-device sync
 * Stored in both localStorage and Supabase active_timers table
 */
export interface ActiveTimerData {
  id: string;                    // timer_id (matches TimeEntry.id format)
  projectId: string;             // Associated project
  startTime: number;             // Start timestamp in milliseconds
  description?: string;          // Optional task description
  timerState: 'running' | 'paused'; // Current timer state
  pausedDuration: number;        // Accumulated paused time in seconds
  createdAt: number;             // Creation timestamp in milliseconds
  updatedAt: number;             // Last update timestamp in milliseconds (for conflict resolution)
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultProject?: string;
}

/**
 * Export file format for data backup/transfer
 */
export interface ExportData {
  // Metadata
  version: string; // Schema version (e.g., "1.0.0")
  exportedAt: number; // Timestamp when export was created
  appVersion: string; // Work Tracker app version

  // Data
  projects: Project[];
  timeEntries: TimeEntry[];
  settings?: AppSettings; // Optional: user may choose not to export settings

  // Summary statistics (for user reference)
  summary: {
    totalProjects: number;
    totalSessions: number;
    totalHoursTracked: number;
    dateRange: {
      earliest: number | null;
      latest: number | null;
    };
  };
}

