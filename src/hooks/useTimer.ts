import { useState, useEffect, useRef, useCallback } from 'react';
import { getActiveTimer, saveActiveTimer, getTimeEntries, saveTimeEntries } from '../lib/storage';
import type { TimeEntry } from '../types';
import { TIMER_UPDATE_INTERVAL, MILLISECONDS_PER_SECOND } from '../constants';

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
  stop: () => void;
  reset: () => void;
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
   * Load active timer from LocalStorage on mount
   * If a timer was paused, restore it in paused state
   */
  useEffect(() => {
    const activeTimer = getActiveTimer();
    if (activeTimer && !activeTimer.endTime) {
      const now = Date.now();
      const pausedDuration = activeTimer.duration || 0;
      
      // Restore timer state
      setElapsedTime(pausedDuration);
      setCurrentEntry(activeTimer);
      setState('paused'); // Start in paused state so user can resume
      pausedTimeRef.current = pausedDuration;
      // Set start time so that if resumed, elapsed time continues correctly
      startTimeRef.current = now - (pausedDuration * MILLISECONDS_PER_SECOND);
    }
  }, []);

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
    const activeTimer = getActiveTimer();
    if (activeTimer && !activeTimer.endTime) {
      console.warn('A timer is already running');
      return;
    }

    const now = Date.now();
    const newEntry: TimeEntry = {
      id: `timer-${now}`,
      projectId,
      startTime: now,
      description,
      createdAt: now,
      updatedAt: now,
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
    
    // Update the active timer with current duration for persistence
    const updatedEntry: TimeEntry = {
      ...currentEntry,
      duration: elapsedTime,
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
    // Adjust start time so that elapsed time calculation continues from paused point
    // Formula: startTime = now - (pausedTime * 1000)
    startTimeRef.current = now - (pausedTimeRef.current * MILLISECONDS_PER_SECOND);
    setState('running');
  }, [state, currentEntry]);

  /**
   * Stop the timer and save the completed session
   * Saves to time entries and clears active timer
   */
  const stop = useCallback(() => {
    if (state === 'idle' || !currentEntry) return;

    const now = Date.now();
    const finalDuration = elapsedTime;

    // Create completed entry with end time and final duration
    const completedEntry: TimeEntry = {
      ...currentEntry,
      endTime: now,
      duration: finalDuration,
    };

    // Save to time entries (add to beginning of array)
    const entries = getTimeEntries();
    entries.unshift(completedEntry);
    saveTimeEntries(entries);

    // Clear active timer
    saveActiveTimer(null);

    // Reset all state
    setState('idle');
    setElapsedTime(0);
    setCurrentEntry(null);
    pausedTimeRef.current = 0;
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
