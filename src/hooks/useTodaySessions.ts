import { useState, useEffect } from 'react';
import { getTodaySessions } from '../lib/database';
import { showError } from '../utils/errorHandler';
import { MAX_RECENT_SESSIONS } from '../constants';
import type { TimeEntry } from '../types';

/**
 * Custom hook for loading today's sessions from database
 * Automatically refreshes when dependency changes
 */
export const useTodaySessions = (refreshTrigger?: unknown) => {
  const [sessions, setSessions] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);

      try {
        const todaySessions = await getTodaySessions(MAX_RECENT_SESSIONS);
        setSessions(todaySessions);
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


