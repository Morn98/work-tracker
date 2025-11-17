import type { TimeEntry } from '../types';
import { getWeekStart, getWeekEnd, getMonthStart, getMonthEnd, getTodayStart } from './dateHelpers';
import { DAILY_BREAKDOWN_DAYS } from '../constants';

// Type alias for compatibility
type Session = TimeEntry;

/**
 * Calculate total time for sessions in a date range
 * @param sessions - Array of time entries to filter and sum
 * @param startDate - Start of the date range (inclusive)
 * @param endDate - End of the date range (inclusive)
 * @returns Total duration in seconds
 */
const calculateTimeInRange = (sessions: Session[], startDate: Date, endDate: Date): number => {
  return sessions
    .filter((session) => {
      // Only include completed sessions (those with endTime)
      if (!session.endTime) return false;
      const sessionDate = new Date(session.endTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    })
    .reduce((total, session) => total + (session.duration || 0), 0);
};

/**
 * Calculate total time for today
 * @param sessions - Array of time entries to calculate from
 * @returns Total duration in seconds for today
 */
export const getTodayTotal = (sessions: Session[]): number => {
  const todayStart = getTodayStart();
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  return calculateTimeInRange(sessions, todayStart, todayEnd);
};

/**
 * Calculate total time for the current week (Monday to Sunday)
 * @param sessions - Array of time entries to calculate from
 * @returns Total duration in seconds for the current week
 */
export const getWeeklyTotal = (sessions: Session[]): number => {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  return calculateTimeInRange(sessions, weekStart, weekEnd);
};

/**
 * Calculate total time for the current month
 * @param sessions - Array of time entries to calculate from
 * @returns Total duration in seconds for the current month
 */
export const getMonthlyTotal = (sessions: Session[]): number => {
  const now = new Date();
  const monthStart = getMonthStart(now);
  const monthEnd = getMonthEnd(now);
  return calculateTimeInRange(sessions, monthStart, monthEnd);
};

/**
 * Statistics for a project aggregated from sessions
 */
export interface ProjectStats {
  projectId: string;
  projectName: string;
  color?: string;
  totalTime: number; // in seconds
  sessionCount: number;
}

/**
 * Group sessions by project and calculate aggregate statistics
 * @param sessions - Array of time entries to group
 * @param projects - Array of projects to match against
 * @returns Array of project statistics, sorted by total time (descending)
 */
export const groupSessionsByProject = (
  sessions: Session[],
  projects: Array<{ id: string; name: string; color?: string }>
): ProjectStats[] => {
  const projectStatsMap = new Map<string, ProjectStats>();

  // Aggregate statistics for each project
  sessions.forEach((session) => {
    const project = projects.find((p) => p.id === session.projectId);
    const projectName = project?.name || 'Unknown Project';
    const projectColor = project?.color;

    // Initialize project stats if not already present
    if (!projectStatsMap.has(session.projectId)) {
      projectStatsMap.set(session.projectId, {
        projectId: session.projectId,
        projectName,
        color: projectColor,
        totalTime: 0,
        sessionCount: 0,
      });
    }

    // Accumulate statistics
    const stats = projectStatsMap.get(session.projectId)!;
    stats.totalTime += session.duration || 0;
    stats.sessionCount += 1;
  });

  // Convert map to array and sort by total time (descending)
  return Array.from(projectStatsMap.values()).sort((a, b) => b.totalTime - a.totalTime);
};

/**
 * Get daily breakdown for a specified number of days
 * @param sessions - Array of time entries to analyze
 * @param days - Number of days to include (default: 7)
 * @returns Array of daily statistics with date, day name, and total time
 */
export interface DailyStats {
  date: Date;
  dayName: string;
  totalTime: number; // in seconds
}

export const getDailyBreakdown = (sessions: Session[], days: number = DAILY_BREAKDOWN_DAYS): DailyStats[] => {
  const now = new Date();
  const dailyStats: DailyStats[] = [];

  // Iterate backwards from today to get the last N days
  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    // Filter sessions for this specific day
    const daySessions = sessions.filter((session) => {
      if (!session.endTime) return false;
      const sessionDate = new Date(session.endTime);
      return sessionDate >= date && sessionDate < nextDate;
    });

    // Sum up total time for this day
    const totalTime = daySessions.reduce((sum, session) => sum + (session.duration || 0), 0);

    dailyStats.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      totalTime,
    });
  }

  return dailyStats;
};

