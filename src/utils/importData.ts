/**
 * Data import utilities for restoring Work Tracker data from exports
 */

import type { ExportData, Project, TimeEntry } from '../types';
import { getActiveTimer, saveActiveTimer } from '../lib/storage';

// TODO: Re-implement with database functions
// Temporary stubs to make TypeScript happy
const getProjects = (): Project[] => [];
const getTimeEntries = (): TimeEntry[] => [];
const saveProjects = (_projects: Project[]): void => {};
const saveTimeEntries = (_entries: TimeEntry[]): void => {};

// Supported schema versions for import
const SUPPORTED_VERSIONS = ['1.0.0'];

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Import options for controlling merge behavior
 */
export interface ImportOptions {
  mergeStrategy: 'replace' | 'append';
  includeSettings?: boolean;
}

/**
 * Import result with statistics
 */
export interface ImportResult {
  success: boolean;
  projectsImported: number;
  entriesImported: number;
  errors: string[];
}

/**
 * Validate exported data structure and integrity
 * @param data - Parsed JSON data to validate
 * @returns Validation result with errors and warnings
 */
export const validateExportData = (data: unknown): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Type guard: check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push('Invalid export file: Data must be an object');
    return { valid: false, errors, warnings };
  }

  const exportData = data as Partial<ExportData>;

  // 1. Check schema version
  if (!exportData.version) {
    errors.push('Missing schema version');
  } else if (!SUPPORTED_VERSIONS.includes(exportData.version)) {
    errors.push(
      `Unsupported schema version: ${exportData.version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
    );
  }

  // 2. Check required metadata
  if (typeof exportData.exportedAt !== 'number') {
    errors.push('Missing or invalid exportedAt timestamp');
  }

  // 3. Validate projects array
  if (!Array.isArray(exportData.projects)) {
    errors.push('Missing or invalid projects array');
  } else {
    exportData.projects.forEach((project, index) => {
      if (!project.id || typeof project.id !== 'string') {
        errors.push(`Project at index ${index}: Missing or invalid id`);
      }
      if (!project.name || typeof project.name !== 'string') {
        errors.push(`Project at index ${index}: Missing or invalid name`);
      }
      if (!project.color || typeof project.color !== 'string') {
        warnings.push(`Project at index ${index}: Missing color, will use default`);
      }
      if (typeof project.createdAt !== 'number') {
        warnings.push(`Project "${project.name}": Missing createdAt timestamp`);
      }
      if (typeof project.updatedAt !== 'number') {
        warnings.push(`Project "${project.name}": Missing updatedAt timestamp`);
      }
    });
  }

  // 4. Validate time entries array
  if (!Array.isArray(exportData.timeEntries)) {
    errors.push('Missing or invalid timeEntries array');
  } else {
    exportData.timeEntries.forEach((entry, index) => {
      if (!entry.id || typeof entry.id !== 'string') {
        errors.push(`Time entry at index ${index}: Missing or invalid id`);
      }
      if (!entry.projectId || typeof entry.projectId !== 'string') {
        errors.push(`Time entry at index ${index}: Missing or invalid projectId`);
      }
      if (typeof entry.startTime !== 'number') {
        errors.push(`Time entry at index ${index}: Missing or invalid startTime`);
      }
      if (typeof entry.createdAt !== 'number') {
        warnings.push(`Time entry at index ${index}: Missing createdAt timestamp`);
      }
      if (typeof entry.updatedAt !== 'number') {
        warnings.push(`Time entry at index ${index}: Missing updatedAt timestamp`);
      }
    });

    // 5. Check referential integrity
    if (Array.isArray(exportData.projects)) {
      const projectIds = new Set(exportData.projects.map((p) => p.id));
      const orphanedEntries = exportData.timeEntries.filter(
        (entry) => !projectIds.has(entry.projectId)
      );

      if (orphanedEntries.length > 0) {
        warnings.push(
          `Found ${orphanedEntries.length} time entries referencing non-existent projects. These will be skipped.`
        );
      }
    }
  }

  // 6. Check for ID collisions with existing data (append mode concern)
  if (Array.isArray(exportData.projects) && Array.isArray(exportData.timeEntries)) {
    const existingProjects = getProjects();
    const existingEntries = getTimeEntries();

    const existingProjectIds = new Set(existingProjects.map((p) => p.id));
    const existingEntryIds = new Set(existingEntries.map((e) => e.id));

    const collidingProjects = exportData.projects.filter((p) => existingProjectIds.has(p.id));
    const collidingEntries = exportData.timeEntries.filter((e) => existingEntryIds.has(e.id));

    if (collidingProjects.length > 0) {
      warnings.push(
        `Found ${collidingProjects.length} projects with IDs that already exist. These will be merged based on your import strategy.`
      );
    }

    if (collidingEntries.length > 0) {
      warnings.push(
        `Found ${collidingEntries.length} time entries with IDs that already exist. These will be merged based on your import strategy.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Import data with specified merge strategy
 * @param data - Validated export data to import
 * @param options - Import options (merge strategy, etc.)
 * @returns Import result with statistics
 */
export const importData = (
  data: ExportData,
  options: ImportOptions
): ImportResult => {
  const errors: string[] = [];
  let projectsImported = 0;
  let entriesImported = 0;

  try {
    const { mergeStrategy } = options;
    const DEFAULT_PROJECT_COLOR = '#3B82F6';
    const now = Date.now();

    // Filter out orphaned time entries (referential integrity)
    const validProjectIds = new Set(data.projects.map((p) => p.id));
    const validEntries = data.timeEntries.filter((entry) => {
      if (!validProjectIds.has(entry.projectId)) {
        errors.push(
          `Skipped time entry ${entry.id}: references non-existent project ${entry.projectId}`
        );
        return false;
      }
      return true;
    });

    // Ensure all data has required fields
    const cleanedProjects: Project[] = data.projects.map((project) => ({
      ...project,
      color: project.color || DEFAULT_PROJECT_COLOR,
      createdAt: project.createdAt || now,
      updatedAt: project.updatedAt || now,
    }));

    const cleanedEntries: TimeEntry[] = validEntries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt || entry.startTime,
      updatedAt: entry.updatedAt || now,
    }));

    // Apply merge strategy
    if (mergeStrategy === 'replace') {
      // Replace: Clear existing data and use imported data
      // BUT preserve active timer if it exists
      const activeTimer = getActiveTimer();

      saveProjects(cleanedProjects);
      saveTimeEntries(cleanedEntries);

      // If there was an active timer and it references a valid project, keep it
      if (activeTimer && !activeTimer.endTime) {
        const projectStillExists = cleanedProjects.some(
          (p) => p.id === activeTimer.projectId
        );
        if (projectStillExists) {
          saveActiveTimer(activeTimer);
        } else {
          // Active timer references a project that's no longer valid, clear it
          saveActiveTimer(null);
          errors.push(
            'Active timer was cleared because its project was not in the imported data'
          );
        }
      }

      projectsImported = cleanedProjects.length;
      entriesImported = cleanedEntries.length;
    } else {
      // Append: Merge with existing data
      const existingProjects = getProjects();
      const existingEntries = getTimeEntries();

      // For projects: replace if ID exists, otherwise add
      const projectMap = new Map(existingProjects.map((p) => [p.id, p]));
      cleanedProjects.forEach((project) => {
        projectMap.set(project.id, project);
      });
      const mergedProjects = Array.from(projectMap.values());

      // For entries: replace if ID exists, otherwise add
      const entryMap = new Map(existingEntries.map((e) => [e.id, e]));
      cleanedEntries.forEach((entry) => {
        entryMap.set(entry.id, entry);
      });
      const mergedEntries = Array.from(entryMap.values());

      saveProjects(mergedProjects);
      saveTimeEntries(mergedEntries);

      projectsImported = cleanedProjects.length;
      entriesImported = cleanedEntries.length;
    }

    return {
      success: true,
      projectsImported,
      entriesImported,
      errors,
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      projectsImported: 0,
      entriesImported: 0,
      errors: [...errors, `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
};

/**
 * Get a preview summary of what would be imported
 * @param data - Export data to preview
 * @returns Human-readable summary string
 */
export const getImportSummary = (data: ExportData): string => {
  const validProjectIds = new Set(data.projects.map((p) => p.id));
  const validEntries = data.timeEntries.filter((e) => validProjectIds.has(e.projectId));
  const orphanedCount = data.timeEntries.length - validEntries.length;

  const completedSessions = validEntries.filter((e) => e.endTime).length;
  const totalHours = validEntries.reduce((total, entry) => {
    return total + (entry.duration || 0);
  }, 0) / 3600;

  let dateRangeStr = 'No sessions';
  const timestamps = validEntries
    .filter((e) => e.endTime)
    .map((e) => e.endTime!);

  if (timestamps.length > 0) {
    const earliest = new Date(Math.min(...timestamps)).toLocaleDateString();
    const latest = new Date(Math.max(...timestamps)).toLocaleDateString();
    dateRangeStr = `${earliest} to ${latest}`;
  }

  const exportDate = new Date(data.exportedAt).toLocaleString();

  let summary = `
Import Preview:
• Schema version: ${data.version}
• Exported on: ${exportDate}
• ${data.projects.length} project${data.projects.length !== 1 ? 's' : ''}
• ${completedSessions} completed session${completedSessions !== 1 ? 's' : ''}
• ${Math.round(totalHours * 100) / 100} total hours tracked
• Date range: ${dateRangeStr}
  `.trim();

  if (orphanedCount > 0) {
    summary += `\n\n⚠️ Warning: ${orphanedCount} time entries reference non-existent projects and will be skipped.`;
  }

  return summary;
};

/**
 * Parse and validate imported file
 * @param fileContent - Raw file content string
 * @returns Parsed and validated export data, or null if invalid
 */
export const parseImportFile = (fileContent: string): {
  data: ExportData | null;
  validation: ValidationResult;
} => {
  try {
    const parsed = JSON.parse(fileContent);
    const validation = validateExportData(parsed);

    if (validation.valid) {
      return { data: parsed as ExportData, validation };
    }

    return { data: null, validation };
  } catch (error) {
    return {
      data: null,
      validation: {
        valid: false,
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      },
    };
  }
};
