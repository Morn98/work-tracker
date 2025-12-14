/**
 * @module useTimer
 * @description Timer State Machine Hook - Multi-device synchronized timer
 *
 * Responsibilities:
 * - Timer state management (idle → running → paused → idle)
 * - Elapsed time calculation with pause/resume support
 * - Multi-device sync via dual-layer storage (localStorage + Supabase)
 * - Cross-tab sync via storage events
 * - Real-time updates via Supabase Realtime
 * - Stale timer detection (>24h auto-clear)
 *
 * Timer States:
 * - idle: No timer running
 * - running: Timer actively counting
 * - paused: Timer paused, can be resumed
 *
 * Data Flow:
 * start() → localStorage (instant) → Supabase (background) → Realtime → other devices
 * pause/resume() → update both layers
 * stop() → save TimeEntry → clear active timer from both layers
 *
 * Sync Strategy:
 * - Optimistic updates: UI updates instantly via localStorage
 * - Background sync: Supabase updated asynchronously
 * - Conflict resolution: Last-write-wins based on updatedAt timestamp
 * - Cross-tab: storage events trigger re-sync
 * - Cross-device: Realtime subscriptions trigger re-sync
 *
 * Dependencies:
 * - storage.ts: localStorage operations
 * - database.ts: Supabase operations + Realtime subscriptions
 * - AuthContext: User authentication state
 *
 * @see ARCHITECTURE.md for multi-device sync details
 * @see Timer.tsx for UI integration
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getActiveTimer, saveActiveTimer } from '../lib/storage';
import {
  saveTimeEntry,
  getActiveTimerFromDb,
  saveActiveTimerToDb,
  clearActiveTimerFromDb,
  subscribeToActiveTimer,
} from '../lib/database';
import type { TimeEntry, ActiveTimerData } from '../types';
import { TIMER_UPDATE_INTERVAL, MILLISECONDS_PER_SECOND } from '../constants';
import { showSuccess, showError } from '../utils/errorHandler';
import { useAuth } from '../contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Timer state: idle (not running), running (actively counting), or paused
 */
type TimerState = 'idle' | 'running' | 'paused';

/**
 * Return type for the useTimer hook
 */
interface UseTimerReturn {
  elapsedTime: number; // in seconds
  state: TimerState;
  currentEntry: TimeEntry | null;
  start: (projectId: string, description?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>; // Now async - saves to database
  reset: () => void;
  isSyncing: boolean; // Whether timer is currently syncing to database
  syncError: Error | null; // Last sync error (if any)
}

/**
 * Custom hook for managing timer functionality
 * Handles start, pause, resume, stop, and persistence to LocalStorage + Supabase
 */
export const useTimer = (): UseTimerReturn => {
  const { user } = useAuth(); // Get current authenticated user

  const [elapsedTime, setElapsedTime] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // Refs to track timer state without causing re-renders
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0); // Timestamp when timer started/resumed
  const pausedTimeRef = useRef<number>(0); // Accumulated paused time in seconds
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Synchronize timer state from localStorage (triggered by other tabs)
   */
  const syncFromStorage = useCallback((timerData: ActiveTimerData | null) => {
    if (!timerData) {
      // Timer completed or cleared in another tab
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setState('idle');
      setElapsedTime(0);
      setCurrentEntry(null);
      pausedTimeRef.current = 0;
      showSuccess('Timer stopped in another tab');
      return;
    }

    const now = Date.now();
    const storedState = timerData.timerState || 'paused';

    setCurrentEntry(timerData);

    if (storedState === 'running') {
      // Calculate elapsed time from stored startTime
      const elapsed = Math.floor((now - timerData.startTime) / MILLISECONDS_PER_SECOND);
      setElapsedTime(elapsed);
      setState('running');
      startTimeRef.current = timerData.startTime;
      pausedTimeRef.current = 0;
      showSuccess('Timer resumed from another tab');
    } else {
      // Restore paused state
      const pausedDuration = timerData.pausedDuration || 0;
      setElapsedTime(pausedDuration);
      setState('paused');
      pausedTimeRef.current = pausedDuration;
      startTimeRef.current = now - (pausedDuration * MILLISECONDS_PER_SECOND);
      showSuccess('Timer paused in another tab');
    }
  }, []);

  /**
   * Load active timer from both database and localStorage on mount
   * Implements conflict resolution: latest updatedAt wins
   */
  useEffect(() => {
    const initializeTimer = async () => {
      // Only initialize if user is authenticated
      if (!user) {
        // Clear local state if not authenticated
        setState('idle');
        setElapsedTime(0);
        setCurrentEntry(null);
        return;
      }

      try {
        // 1. Try to load from database first
        const dbTimer = await getActiveTimerFromDb();

        // 2. Also check localStorage for offline changes
        const localTimer = getActiveTimer() as ActiveTimerData | null;

        // 3. Conflict resolution: Use most recently updated
        let timerToUse: ActiveTimerData | null = null;

        if (dbTimer && localTimer) {
          // Both exist - use the one with latest updatedAt
          timerToUse = dbTimer.updatedAt > (localTimer.updatedAt || 0) ? dbTimer : localTimer;

          // Sync the winner to both storage layers
          if (timerToUse === dbTimer) {
            saveActiveTimer(dbTimer); // Update localStorage
          } else {
            await saveActiveTimerToDb(localTimer); // Update database
          }
        } else {
          // Only one exists
          timerToUse = dbTimer || localTimer;

          // Sync to missing layer
          if (dbTimer && !localTimer) {
            saveActiveTimer(dbTimer);
          } else if (localTimer && !dbTimer) {
            await saveActiveTimerToDb(localTimer);
          }
        }

        // 4. Restore timer state
        if (timerToUse) {
          const now = Date.now();
          const wasRunning = timerToUse.timerState === 'running';

          setCurrentEntry(timerToUse);

          if (wasRunning) {
            // Auto-resume running timer
            const elapsed = Math.floor((now - timerToUse.startTime) / MILLISECONDS_PER_SECOND);
            setElapsedTime(elapsed);
            setState('running');
            startTimeRef.current = timerToUse.startTime;
            pausedTimeRef.current = 0;
          } else {
            // Restore paused timer
            const pausedDuration = timerToUse.pausedDuration || 0;
            setElapsedTime(pausedDuration);
            setState('paused');
            pausedTimeRef.current = pausedDuration;
            startTimeRef.current = now - (pausedDuration * MILLISECONDS_PER_SECOND);
          }
        }
      } catch (error) {
        console.error('Failed to initialize timer from database:', error);
        setSyncError(error as Error);

        // Fallback to localStorage only
        const localTimer = getActiveTimer() as ActiveTimerData | null;
        if (localTimer) {
          const now = Date.now();
          const wasRunning = localTimer.timerState === 'running';

          setCurrentEntry(localTimer);

          if (wasRunning) {
            const elapsed = Math.floor((now - localTimer.startTime) / MILLISECONDS_PER_SECOND);
            setElapsedTime(elapsed);
            setState('running');
            startTimeRef.current = localTimer.startTime;
            pausedTimeRef.current = 0;
          } else {
            const pausedDuration = localTimer.pausedDuration || 0;
            setElapsedTime(pausedDuration);
            setState('paused');
            pausedTimeRef.current = pausedDuration;
            startTimeRef.current = now - (pausedDuration * MILLISECONDS_PER_SECOND);
          }
        }
      }
    };

    initializeTimer();
  }, [user]);

  /**
   * Listen for timer changes from other tabs (localStorage sync)
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to active timer changes from OTHER tabs
      if (e.key !== 'work-tracker-active-timer') return;

      // Parse new value
      const newActiveTimer = e.newValue ? JSON.parse(e.newValue) as ActiveTimerData : null;

      // Sync state with other tabs
      syncFromStorage(newActiveTimer);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncFromStorage]);

  /**
   * Subscribe to active timer changes from other devices (Realtime sync)
   */
  useEffect(() => {
    if (!user) return;

    // Subscribe to database changes
    const channel = subscribeToActiveTimer(user.id, (updatedTimer) => {
      // Check if this change came from this device (avoid feedback loop)
      const localTimer = getActiveTimer() as ActiveTimerData | null;

      // Ignore if this is our own change (same updatedAt timestamp)
      if (localTimer && updatedTimer && localTimer.updatedAt === updatedTimer.updatedAt) {
        return;
      }

      if (!updatedTimer) {
        // Timer was cleared on another device
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setState('idle');
        setElapsedTime(0);
        setCurrentEntry(null);
        pausedTimeRef.current = 0;
        saveActiveTimer(null); // Clear localStorage
        showSuccess('Timer stopped on another device');
        return;
      }

      // Another device modified the timer - sync state
      syncFromStorage(updatedTimer);
    });

    realtimeChannelRef.current = channel;

    return () => {
      // Cleanup subscription on unmount
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
    };
  }, [user, syncFromStorage]);

  /**
   * Update elapsed time every second when timer is running
   * Clears interval when paused or stopped
   */
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        // Calculate elapsed time: (current time - start time) / 1000
        const totalElapsed = Math.floor((now - startTimeRef.current) / MILLISECONDS_PER_SECOND);
        setElapsedTime(totalElapsed);
      }, TIMER_UPDATE_INTERVAL);
    } else {
      // Clear interval when not running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount or state change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  /**
   * Start a new timer session
   * @param projectId - ID of the project to track time for
   * @param description - Optional description of the work being done
   */
  const start = useCallback((projectId: string, description?: string) => {
    // Prevent starting if there's already an active timer
    const activeTimer = getActiveTimer() as ActiveTimerData | null;
    if (activeTimer) {
      console.warn('A timer is already running');
      return;
    }

    const now = Date.now();
    const newEntry: ActiveTimerData = {
      id: `timer-${now}`,
      projectId,
      startTime: now,
      description,
      createdAt: now,
      updatedAt: now,
      timerState: 'running',
      pausedDuration: 0,
    };

    // Update local state immediately (optimistic update)
    setCurrentEntry(newEntry);
    setState('running');
    setElapsedTime(0);
    startTimeRef.current = now;
    pausedTimeRef.current = 0;

    // Save to localStorage (instant)
    saveActiveTimer(newEntry);

    // Save to database (async, don't block UI)
    if (user) {
      setIsSyncing(true);
      saveActiveTimerToDb(newEntry)
        .then(() => {
          setIsSyncing(false);
          setSyncError(null);
        })
        .catch((error) => {
          setIsSyncing(false);
          console.error('Failed to sync timer start to database:', error);
          setSyncError(error);
          showError('Timer started locally, but sync failed. Will retry.');
        });
    }
  }, [user]);

  /**
   * Pause the currently running timer
   * Saves current duration to both localStorage and database
   */
  const pause = useCallback(() => {
    if (state !== 'running' || !currentEntry) return;

    const now = Date.now();
    setState('paused');
    pausedTimeRef.current = elapsedTime;

    const updatedEntry: ActiveTimerData = {
      ...currentEntry,
      timerState: 'paused',
      pausedDuration: elapsedTime,
      updatedAt: now,
    };

    // Save locally first
    saveActiveTimer(updatedEntry);
    setCurrentEntry(updatedEntry);

    // Sync to database
    if (user) {
      setIsSyncing(true);
      saveActiveTimerToDb(updatedEntry)
        .then(() => {
          setIsSyncing(false);
          setSyncError(null);
        })
        .catch((error) => {
          setIsSyncing(false);
          console.error('Failed to sync timer pause to database:', error);
          setSyncError(error);
        });
    }
  }, [state, currentEntry, elapsedTime, user]);

  /**
   * Resume a paused timer
   * Adjusts start time so elapsed time continues from where it was paused
   */
  const resume = useCallback(() => {
    if (state !== 'paused' || !currentEntry) return;

    const now = Date.now();
    startTimeRef.current = now - (pausedTimeRef.current * MILLISECONDS_PER_SECOND);
    setState('running');

    const updatedEntry: ActiveTimerData = {
      ...currentEntry,
      startTime: startTimeRef.current,
      timerState: 'running',
      pausedDuration: pausedTimeRef.current,
      updatedAt: now,
    };

    // Save locally first
    saveActiveTimer(updatedEntry);
    setCurrentEntry(updatedEntry);

    // Sync to database
    if (user) {
      setIsSyncing(true);
      saveActiveTimerToDb(updatedEntry)
        .then(() => {
          setIsSyncing(false);
          setSyncError(null);
        })
        .catch((error) => {
          setIsSyncing(false);
          console.error('Failed to sync timer resume to database:', error);
          setSyncError(error);
        });
    }
  }, [state, currentEntry, user]);

  /**
   * Stop the timer and save the completed session
   * Saves to time_entries and clears from both localStorage and database
   */
  const stop = useCallback(async () => {
    if (state === 'idle' || !currentEntry) return;

    const now = Date.now();
    const finalDuration = elapsedTime;

    // Create completed entry with end time and final duration
    const completedEntry: TimeEntry = {
      ...currentEntry,
      endTime: now,
      duration: finalDuration,
      updatedAt: now,
    };

    try {
      setIsSyncing(true);

      // Save completed entry to time_entries table
      await saveTimeEntry(completedEntry);

      // Clear active timer from BOTH storage layers
      saveActiveTimer(null); // localStorage
      if (user) {
        await clearActiveTimerFromDb(); // database
      }

      // Reset all state
      setState('idle');
      setElapsedTime(0);
      setCurrentEntry(null);
      pausedTimeRef.current = 0;
      setIsSyncing(false);
      setSyncError(null);

      showSuccess('Session saved successfully!');
    } catch (error) {
      setIsSyncing(false);
      console.error('Failed to save session:', error);
      setSyncError(error as Error);
      showError('Failed to save session. Please try again.');
      // Keep timer state so user can retry
    }
  }, [state, currentEntry, elapsedTime, user]);

  /**
   * Reset timer completely (clears everything)
   * Useful for error recovery or manual reset
   */
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear from both storage layers
    saveActiveTimer(null);
    if (user) {
      clearActiveTimerFromDb().catch((error) => {
        console.error('Failed to clear timer from database:', error);
      });
    }

    setState('idle');
    setElapsedTime(0);
    setCurrentEntry(null);
    pausedTimeRef.current = 0;
    setSyncError(null);
  }, [user]);

  return {
    elapsedTime,
    state,
    currentEntry,
    start,
    pause,
    resume,
    stop,
    reset,
    isSyncing,
    syncError,
  };
};
