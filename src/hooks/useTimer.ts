import { useState, useEffect, useRef, useCallback } from 'react';
import { getActiveTimer, saveActiveTimer } from '../lib/storage';
import { saveTimeEntry } from '../lib/database';
import type { TimeEntry } from '../types';
import { TIMER_UPDATE_INTERVAL, MILLISECONDS_PER_SECOND } from '../constants';
import { showSuccess, showError } from '../utils/errorHandler';

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
}

/**
 * Extended TimeEntry for active timer with runtime state
 */
interface ActiveTimerData extends TimeEntry {
  timerState?: 'running' | 'paused'; // Explicit timer state for persistence
}

/**
 * Custom hook for managing timer functionality
 * Handles start, pause, resume, stop, and persistence to LocalStorage
 */
export const useTimer = (): UseTimerReturn => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  
  // Refs to track timer state without causing re-renders
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0); // Timestamp when timer started/resumed
  const pausedTimeRef = useRef<number>(0); // Accumulated paused time in seconds

  /**
   * Synchronize timer state from localStorage (triggered by other tabs)
   */
  const syncFromStorage = useCallback((timerData: ActiveTimerData | null) => {
    if (!timerData || timerData.endTime) {
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
      const pausedDuration = timerData.duration || 0;
      setElapsedTime(pausedDuration);
      setState('paused');
      pausedTimeRef.current = pausedDuration;
      startTimeRef.current = now - (pausedDuration * MILLISECONDS_PER_SECOND);
      showSuccess('Timer paused in another tab');
    }
  }, []);

  /**
   * Load active timer from LocalStorage on mount
   * Auto-resume if timer was running, restore paused if it was paused
   */
  useEffect(() => {
    const activeTimer = getActiveTimer() as ActiveTimerData | null;
    if (activeTimer && !activeTimer.endTime) {
      const now = Date.now();
      const wasRunning = activeTimer.timerState === 'running';

      setCurrentEntry(activeTimer);

      if (wasRunning) {
        // AUTO-RESUME: Timer continues from where it left off
        const elapsed = Math.floor((now - activeTimer.startTime) / MILLISECONDS_PER_SECOND);
        setElapsedTime(elapsed);
        setState('running');
        startTimeRef.current = activeTimer.startTime;
        pausedTimeRef.current = 0;
      } else {
        // Restore in paused state (backward compatible)
        const pausedDuration = activeTimer.duration || 0;
        setElapsedTime(pausedDuration);
        setState('paused');
        pausedTimeRef.current = pausedDuration;
        startTimeRef.current = now - (pausedDuration * MILLISECONDS_PER_SECOND);
      }
    }
  }, []);

  /**
   * Listen for timer changes from other tabs
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
    if (activeTimer && !activeTimer.endTime) {
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
      timerState: 'running', // NEW: Mark as running
    };

    setCurrentEntry(newEntry);
    setState('running');
    setElapsedTime(0);
    startTimeRef.current = now;
    pausedTimeRef.current = 0;
    saveActiveTimer(newEntry);
  }, []);

  /**
   * Pause the currently running timer
   * Saves current duration to LocalStorage
   */
  const pause = useCallback(() => {
    if (state !== 'running' || !currentEntry) return;

    setState('paused');
    pausedTimeRef.current = elapsedTime;

    const updatedEntry: ActiveTimerData = {
      ...currentEntry,
      duration: elapsedTime,
      timerState: 'paused', // NEW: Mark as paused
    };
    saveActiveTimer(updatedEntry);
  }, [state, currentEntry, elapsedTime]);

  /**
   * Resume a paused timer
   * Adjusts start time so elapsed time continues from where it was paused
   */
  const resume = useCallback(() => {
    if (state !== 'paused' || !currentEntry) return;

    const now = Date.now();
    startTimeRef.current = now - (pausedTimeRef.current * MILLISECONDS_PER_SECOND);
    setState('running');

    // NEW: Update storage to mark as running
    const updatedEntry: ActiveTimerData = {
      ...currentEntry,
      startTime: startTimeRef.current, // Update for accurate calculation
      timerState: 'running',
    };
    saveActiveTimer(updatedEntry);
  }, [state, currentEntry]);

  /**
   * Stop the timer and save the completed session
   * Saves to database and clears active timer from localStorage
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
    };

    try {
      // Save to database (async)
      await saveTimeEntry(completedEntry);

      // Clear active timer from localStorage
      saveActiveTimer(null);

      // Reset all state
      setState('idle');
      setElapsedTime(0);
      setCurrentEntry(null);
      pausedTimeRef.current = 0;

      showSuccess('Session saved successfully!');
    } catch (error) {
      console.error('Failed to save session:', error);
      showError('Failed to save session. Please try again.');
      // Keep timer state so user can retry
    }
  }, [state, currentEntry, elapsedTime]);

  /**
   * Reset timer completely (clears everything)
   * Useful for error recovery or manual reset
   */
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    saveActiveTimer(null);
    setState('idle');
    setElapsedTime(0);
    setCurrentEntry(null);
    pausedTimeRef.current = 0;
  }, []);

  return {
    elapsedTime,
    state,
    currentEntry,
    start,
    pause,
    resume,
    stop,
    reset,
  };
};
