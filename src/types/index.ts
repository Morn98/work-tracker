export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt?: number; // Optional for backward compatibility
}

export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: number;
  endTime?: number;
  description?: string;
  duration?: number; // in seconds
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultProject?: string;
}

