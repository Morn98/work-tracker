import { useState, useEffect } from 'react';
import { getProjects } from '../lib/database';
import { showError } from '../utils/errorHandler';
import type { Project } from '../types';

/**
 * Custom hook for managing projects
 * Loads projects from Supabase database and provides refresh functionality
 */
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


