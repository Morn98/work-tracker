import { useState, useEffect } from 'react';
import { getTimeEntries } from '../lib/database';
import { getTodayStart } from '../utils/dateHelpers';
import { showError } from '../utils/errorHandler';
import { MAX_RECENT_SESSIONS } from '../constants';
import type { TimeEntry } from '../types';

/**
 * Custom hook for loading today's sessions
 * Fetches all time entries and filters for today on the frontend
 * Automatically refreshes when dependency changes
 */
export const useTodaySessions = (refreshTrigger?: unknown) => {
  const [sessions, setSessions] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);

      try {
        const allEntries = await getTimeEntries();
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load sessions';
        showError(message);
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [refreshTrigger]);

  return { sessions, isLoading };
};


