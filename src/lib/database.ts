/**
 * Supabase Database Layer
 * Handles all database operations for projects and time entries
 */

import { supabase } from './supabase';
import type { Project, TimeEntry } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Database row types (with timestamp strings from Postgres)
 */
type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean | null;
};

type TimeEntryRow = {
  id: string;
  user_id: string;
  project_id: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  duration: number | null;
  created_at: string;
  updated_at: string;
  is_manual: boolean | null;
};

/**
 * Statistics types returned from database functions
 */
export type ProjectStats = {
  project_id: string;
  project_name: string;
  project_color: string;
  total_time: number;
  session_count: number;
};

export type DailyStats = {
  date: string;
  day_name: string;
  total_time: number;
};

// ============================================================================
// TYPE CONVERSION HELPERS
// ============================================================================

/**
 * Convert database row to Project type (timestamp strings to numbers)
 */
const rowToProject = (row: ProjectRow): Project => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  color: row.color,
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
  isArchived: row.is_archived || undefined,
});

/**
 * Convert database row to TimeEntry type
 */
const rowToTimeEntry = (row: TimeEntryRow): TimeEntry => ({
  id: row.id,
  projectId: row.project_id,
  startTime: new Date(row.start_time).getTime(),
  endTime: row.end_time ? new Date(row.end_time).getTime() : undefined,
  description: row.description || undefined,
  duration: row.duration || undefined,
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
  isManual: row.is_manual || undefined,
});

/**
 * Convert Project to database insert format
 */
const projectToInsert = (
  project: Project,
  userId: string
): Omit<ProjectRow, 'created_at' | 'updated_at'> => ({
  id: project.id,
  user_id: userId,
  name: project.name,
  description: project.description || null,
  color: project.color,
  is_archived: project.isArchived || null,
});

/**
 * Convert TimeEntry to database insert format
 */
const timeEntryToInsert = (
  entry: TimeEntry,
  userId: string
): Omit<TimeEntryRow, 'created_at' | 'updated_at'> => ({
  id: entry.id,
  user_id: userId,
  project_id: entry.projectId,
  start_time: new Date(entry.startTime).toISOString(),
  end_time: entry.endTime ? new Date(entry.endTime).toISOString() : null,
  description: entry.description || null,
  duration: entry.duration || null,
  is_manual: entry.isManual || null,
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class DatabaseError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Helper to throw standardized database errors
 */
const throwDatabaseError = (operation: string, error: unknown): never => {
  console.error(`Database error during ${operation}:`, error);

  if (error && typeof error === 'object' && 'message' in error) {
    throw new DatabaseError(
      `Failed to ${operation}: ${error.message}`,
      'code' in error ? String(error.code) : undefined,
      error
    );
  }

  throw new DatabaseError(`Failed to ${operation}`, undefined, error);
};

/**
 * Get current user ID or throw error if not authenticated
 */
const getCurrentUserId = async (): Promise<string> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new DatabaseError('User not authenticated. Please log in again.');
  }

  return user.id;
};

// ============================================================================
// PROJECTS CRUD OPERATIONS
// ============================================================================

/**
 * Get all projects for the current user
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(rowToProject);
  } catch (error) {
    return throwDatabaseError('fetch projects', error);
  }
};

/**
 * Save a project (create or update)
 */
export const saveProject = async (project: Project): Promise<void> => {
  try {
    const userId = await getCurrentUserId();

    // Check if project exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project.id)
      .eq('user_id', userId)
      .single();

    const projectData = projectToInsert(project, userId);

    if (existing) {
      // Update existing project
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', project.id)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new project
      const { error } = await supabase.from('projects').insert(projectData);

      if (error) throw error;
    }
  } catch (error) {
    return throwDatabaseError('save project', error);
  }
};

/**
 * Delete a project by ID
 */
export const deleteProject = async (id: string): Promise<void> => {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    return throwDatabaseError('delete project', error);
  }
};

// ============================================================================
// TIME ENTRIES CRUD OPERATIONS
// ============================================================================

/**
 * Get all time entries for the current user
 */
export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;

    return (data || []).map(rowToTimeEntry);
  } catch (error) {
    return throwDatabaseError('fetch time entries', error);
  }
};

/**
 * Save a time entry (create or update)
 */
export const saveTimeEntry = async (entry: TimeEntry): Promise<void> => {
  try {
    const userId = await getCurrentUserId();

    // Check if entry exists
    const { data: existing } = await supabase
      .from('time_entries')
      .select('id')
      .eq('id', entry.id)
      .eq('user_id', userId)
      .single();

    const entryData = timeEntryToInsert(entry, userId);

    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('time_entries')
        .update(entryData)
        .eq('id', entry.id)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new entry
      const { error } = await supabase.from('time_entries').insert(entryData);

      if (error) throw error;
    }
  } catch (error) {
    return throwDatabaseError('save time entry', error);
  }
};

/**
 * Delete a time entry by ID
 */
export const deleteTimeEntry = async (id: string): Promise<void> => {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    return throwDatabaseError('delete time entry', error);
  }
};

// ============================================================================
// STATISTICS QUERIES
// ============================================================================

/**
 * Get today's total time in seconds
 */
export const getTodayTotal = async (): Promise<number> => {
  try {
    const userId = await getCurrentUserId();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from('time_entries')
      .select('duration')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .gte('end_time', todayISO);

    if (error) throw error;

    return (data || []).reduce((sum, entry) => sum + (entry.duration || 0), 0);
  } catch (error) {
    return throwDatabaseError('get today total', error);
  }
};

/**
 * Get weekly total time in seconds
 */
export const getWeeklyTotal = async (): Promise<number> => {
  try {
    const userId = await getCurrentUserId();

    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    const mondayISO = monday.toISOString();

    const { data, error } = await supabase
      .from('time_entries')
      .select('duration')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .gte('end_time', mondayISO);

    if (error) throw error;

    return (data || []).reduce((sum, entry) => sum + (entry.duration || 0), 0);
  } catch (error) {
    return throwDatabaseError('get weekly total', error);
  }
};

/**
 * Get monthly total time in seconds
 */
export const getMonthlyTotal = async (): Promise<number> => {
  try {
    const userId = await getCurrentUserId();

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const firstOfMonthISO = firstOfMonth.toISOString();

    const { data, error } = await supabase
      .from('time_entries')
      .select('duration')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .gte('end_time', firstOfMonthISO);

    if (error) throw error;

    return (data || []).reduce((sum, entry) => sum + (entry.duration || 0), 0);
  } catch (error) {
    return throwDatabaseError('get monthly total', error);
  }
};

/**
 * Get project statistics for current month
 */
export const getMonthlyProjectStats = async (): Promise<ProjectStats[]> => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase.rpc('get_monthly_project_stats', {
      p_user_id: userId,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    return throwDatabaseError('get project stats', error);
  }
};

/**
 * Get daily breakdown for last N days
 */
export const getDailyBreakdown = async (
  days: number = 7
): Promise<DailyStats[]> => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase.rpc('get_daily_breakdown', {
      p_user_id: userId,
      p_days: days,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    return throwDatabaseError('get daily breakdown', error);
  }
};

/**
 * Get today's sessions (completed time entries from today)
 */
export const getTodaySessions = async (limit: number = 10): Promise<TimeEntry[]> => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase.rpc('get_today_sessions', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) throw error;

    return (data || []).map(rowToTimeEntry);
  } catch (error) {
    return throwDatabaseError('get today sessions', error);
  }
};

/**
 * Get recent sessions (for dashboard)
 */
export const getRecentSessions = async (
  limit: number = 10
): Promise<TimeEntry[]> => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .order('end_time', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(rowToTimeEntry);
  } catch (error) {
    return throwDatabaseError('get recent sessions', error);
  }
};

// ============================================================================
// ALIASES FOR COMPATIBILITY
// ============================================================================

export const getSessions = getTimeEntries;
export const saveSession = saveTimeEntry;
export const deleteSession = deleteTimeEntry;
