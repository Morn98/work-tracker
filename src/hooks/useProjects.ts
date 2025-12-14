/**
 * @module useProjects
 * @description Projects Data Hook - Fetch and manage project list
 *
 * Responsibilities:
 * - Auto-fetch projects on mount
 * - Loading and error state management
 * - Manual refresh capability
 *
 * Data Flow:
 * useProjects() → database.getProjects() → Supabase → cache → state
 *
 * Usage Pattern:
 * const { projects, isLoading, error, refresh } = useProjects()
 * // Auto-fetches on mount, call refresh() after mutations
 *
 * Dependencies:
 * - database.ts: getProjects() function
 * - errorHandler.ts: User feedback for errors
 *
 * @see database.ts for CRUD operations
 * @see Projects.tsx for UI integration
 */

import { useState, useEffect } from 'react';
import { getProjects } from '../lib/database';
import { showError } from '../utils/errorHandler';
import type { Project } from '../types';
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedProjects = await getProjects();
      setProjects(loadedProjects);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
      showError(message);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    isLoading,
    error,
    refresh: loadProjects,
  };
};


