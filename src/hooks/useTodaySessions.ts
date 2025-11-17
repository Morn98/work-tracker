import { useState, useEffect } from 'react';
import { getTimeEntries } from '../lib/storage';
import { getTodayStart } from '../utils/dateHelpers';
import { MAX_RECENT_SESSIONS } from '../constants';
import type { TimeEntry } from '../types';

/**
 * Custom hook for loading today's sessions
 * Automatically refreshes when dependency changes
 */
export const useTodaySessions = (refreshTrigger?: unknown) => {
  const [sessions, setSessions] = useState<TimeEntry[]>([]);

  useEffect(() => {
    const allEntries = getTimeEntries();
    const todayStart = getTodayStart();

    // Filter sessions from today
    const todaySessions = allEntries.filter((entry) => {
      if (!entry.endTime) return false;
      const entryDate = new Date(entry.endTime);
      return entryDate >= todayStart;
    });

    // Sort by end time (most recent first) and limit
    const sortedSessions = todaySessions
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
      .slice(0, MAX_RECENT_SESSIONS);

    setSessions(sortedSessions);
  }, [refreshTrigger]);

  return sessions;
};


