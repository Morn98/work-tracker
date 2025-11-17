import { useState, useEffect } from 'react';
import { getProjects } from '../lib/storage';
import type { Project } from '../types';

/**
 * Custom hook for managing projects
 * Loads projects from LocalStorage and provides refresh functionality
 */
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = () => {
    setIsLoading(true);
    const loadedProjects = getProjects();
    setProjects(loadedProjects);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    isLoading,
    refresh: loadProjects,
  };
};


