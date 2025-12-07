/**
 * Data export utilities for backing up and transferring Work Tracker data
 */

import type { ExportData } from '../types';
import { getProjects, getTimeEntries, getSettings } from '../lib/storage';

// Current schema version
const SCHEMA_VERSION = '1.0.0';

// App version from package.json
const APP_VERSION = '0.0.0';

/**
 * Generate export data from current LocalStorage
 * @param includeSettings Whether to include app settings in export
 * @returns ExportData object ready for serialization
 */
export const generateExportData = (includeSettings: boolean = false): ExportData => {
  const projects = getProjects();
  const timeEntries = getTimeEntries();
  const settings = includeSettings ? getSettings() : undefined;

  // Calculate summary statistics
  const totalHoursTracked = timeEntries.reduce((total, entry) => {
    return total + (entry.duration || 0);
  }, 0) / 3600; // Convert seconds to hours

  // Find date range
  const timestamps = timeEntries
    .filter(entry => entry.endTime) // Only completed sessions
    .map(entry => entry.endTime!);

  const earliest = timestamps.length > 0 ? Math.min(...timestamps) : null;
  const latest = timestamps.length > 0 ? Math.max(...timestamps) : null;

  return {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    appVersion: APP_VERSION,
    projects,
    timeEntries,
    settings,
    summary: {
      totalProjects: projects.length,
      totalSessions: timeEntries.filter(e => e.endTime).length,
      totalHoursTracked: Math.round(totalHoursTracked * 100) / 100, // Round to 2 decimals
      dateRange: {
        earliest,
        latest,
      },
    },
  };
};

/**
 * Export data as JSON file download
 * @param includeSettings Whether to include app settings
 */
export const exportToJSON = (includeSettings: boolean = false): void => {
  const exportData = generateExportData(includeSettings);

  // Create formatted JSON string
  const jsonString = JSON.stringify(exportData, null, 2);

  // Create blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Generate filename with current date
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `work-tracker-export-${date}.json`;

  // Trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get human-readable export summary for display
 */
export const getExportSummary = (): string => {
  const data = generateExportData(false);
  const { summary } = data;

  let dateRangeStr = 'No sessions';
  if (summary.dateRange.earliest && summary.dateRange.latest) {
    const earliest = new Date(summary.dateRange.earliest).toLocaleDateString();
    const latest = new Date(summary.dateRange.latest).toLocaleDateString();
    dateRangeStr = `${earliest} to ${latest}`;
  }

  return `
Export will include:
• ${summary.totalProjects} project${summary.totalProjects !== 1 ? 's' : ''}
• ${summary.totalSessions} completed session${summary.totalSessions !== 1 ? 's' : ''}
• ${summary.totalHoursTracked} total hours tracked
• Date range: ${dateRangeStr}
  `.trim();
};
