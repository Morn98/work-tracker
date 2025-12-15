import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Header, Card, Button } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { exportToJSON, getExportSummary } from '../utils/exportData';
import {
  parseImportFile,
  importData,
  getImportSummary,
  type ImportOptions,
  type ValidationResult,
} from '../utils/importData';
import type { ExportData } from '../types';
import { showSuccess, showError } from '../utils/errorHandler';
import { getTimeEntries, toggleTimeEntryDeactivation, getProjects } from '../lib/database';
import { formatDateTime, formatDuration } from '../utils/formatTime';
import type { TimeEntry, Project } from '../types';

// Export Preview Component
const ExportPreview = () => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summaryText = await getExportSummary();
        setSummary(summaryText);
      } catch (error) {
        console.error('Failed to load export summary:', error);
        setSummary('Failed to load export preview');
      } finally {
        setIsLoading(false);
      }
    };
    loadSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
      {summary}
    </div>
  );
};

export const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [deactivatedSessions, setDeactivatedSessions] = useState<TimeEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingActiveSessions, setIsLoadingActiveSessions] = useState(false);
  const [showDeactivatedSection, setShowDeactivatedSection] = useState(false);
  const [showAllSessionsSection, setShowAllSessionsSection] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [importFile, setImportFile] = useState<ExportData | null>(null);
  const [importValidation, setImportValidation] = useState<ValidationResult | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [mergeStrategy, setMergeStrategy] = useState<'replace' | 'append'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    try {
      await exportToJSON(false);
      showSuccess('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export data. Please try again.');
    }
  };

  const toggleExportPreview = async () => {
    setShowExportPreview(!showExportPreview);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const { data, validation } = await parseImportFile(fileContent);

      setImportFile(data);
      setImportValidation(validation);

      if (validation.valid && data) {
        setShowImportPreview(true);
      } else {
        showError(
          `Invalid import file:\n${validation.errors.join('\n')}`
        );
      }
    } catch (error) {
      console.error('File read error:', error);
      showError('Failed to read import file. Please try again.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportData = async () => {
    if (!importFile) return;

    try {
      const options: ImportOptions = {
        mergeStrategy,
        includeSettings: false,
      };

      const result = await importData(importFile, options);

      if (result.success) {
        showSuccess(
          `Import successful!\n${result.projectsImported} projects and ${result.entriesImported} time entries imported.`
        );
        setShowImportPreview(false);
        setImportFile(null);
        setImportValidation(null);

        // Reload data if sections are visible
        if (showDeactivatedSection) {
          loadDeactivatedSessions();
        }
        if (showAllSessionsSection) {
          loadAllSessions();
        }
      } else {
        showError(`Import failed:\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      showError('Failed to import data. Please try again.');
    }
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setImportFile(null);
    setImportValidation(null);
  };

  useEffect(() => {
    if (showDeactivatedSection) {
      loadDeactivatedSessions();
    }
  }, [showDeactivatedSection]);

  useEffect(() => {
    if (showAllSessionsSection) {
      loadAllSessions();
    }
  }, [showAllSessionsSection]);

  const loadDeactivatedSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const [allSessions, allProjects] = await Promise.all([
        getTimeEntries(),
        getProjects()
      ]);
      const deactivated = allSessions
        .filter((s) => s.isDeactivated && s.endTime) // Only completed, deactivated sessions
        .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
      setDeactivatedSessions(deactivated);
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load deactivated sessions:', error);
      showError('Failed to load deactivated sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadAllSessions = async () => {
    setIsLoadingActiveSessions(true);
    try {
      const [allSessions, allProjects] = await Promise.all([
        getTimeEntries(),
        getProjects()
      ]);
      const active = allSessions
        .filter((s) => !s.isDeactivated && s.endTime) // Only completed, active sessions
        .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
      setActiveSessions(active);
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      showError('Failed to load sessions');
    } finally {
      setIsLoadingActiveSessions(false);
    }
  };

  const handleToggleDeactivation = async (sessionId: string, currentState: boolean) => {
    try {
      await toggleTimeEntryDeactivation(sessionId, !currentState);
      showSuccess(currentState ? 'Session reactivated' : 'Session deactivated');
      // Reload both lists
      if (showDeactivatedSection) {
        loadDeactivatedSessions();
      }
      if (showAllSessionsSection) {
        loadAllSessions();
      }
    } catch (error) {
      console.error('Failed to toggle session:', error);
      showError('Failed to update session');
    }
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const groupSessionsByProject = (sessions: TimeEntry[]): Map<string, TimeEntry[]> => {
    const grouped = new Map<string, TimeEntry[]>();
    sessions.forEach(session => {
      if (!grouped.has(session.projectId)) {
        grouped.set(session.projectId, []);
      }
      grouped.get(session.projectId)!.push(session);
    });
    return grouped;
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      showError('Failed to logout. Please try again.');
    }
  };

  return (
    <PageContainer>
      <Header
        title="Settings"
        description="Manage your application preferences"
      />

      <div className="max-w-3xl space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Account
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">
                {user?.email}
              </p>
            </div>
            <div>
              <Button variant="secondary" onClick={handleLogout}>
                🚪 Logout
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Appearance
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Choose your preferred color theme. System will match your device settings.
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Data Management
          </h3>
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your projects and time entries are stored in the Supabase database. Settings and active timer are stored locally in your browser.
            </p>

            {/* Export Section */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Export Data
                </h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="secondary" onClick={handleExportData}>
                    📥 Export to JSON
                  </Button>
                  <Button variant="secondary" onClick={toggleExportPreview}>
                    {showExportPreview ? '🔼 Hide Preview' : '🔽 Show Preview'}
                  </Button>
                </div>

                {showExportPreview && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <ExportPreview />
                  </div>
                )}
              </div>

              {/* Import Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Import Data
                </h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-900 dark:text-white
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    dark:file:bg-blue-900/30 dark:file:text-blue-300
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                    file:cursor-pointer cursor-pointer"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Select a JSON file exported from Work Tracker
                </p>
              </div>
            </div>

            {/* Import Preview Dialog */}
            {showImportPreview && importFile && importValidation && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Import Preview
                </h4>

                <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                  {getImportSummary(importFile)}
                </div>

                {importValidation.warnings.length > 0 && (
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {importValidation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Import Strategy
                  </label>
                  <select
                    value={mergeStrategy}
                    onChange={(e) => setMergeStrategy(e.target.value as 'replace' | 'append')}
                    className="w-full max-w-xs px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="append">Merge with existing data</option>
                    <option value="replace">Replace all existing data</option>
                  </select>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    {mergeStrategy === 'append'
                      ? 'Imported data will be merged with your existing projects and time entries.'
                      : '⚠️ All existing data will be deleted and replaced with imported data.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="primary" onClick={handleImportData}>
                    ✅ Confirm Import
                  </Button>
                  <Button variant="secondary" onClick={handleCancelImport}>
                    ❌ Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Session Management
          </h3>

          {/* Active Sessions Section */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium text-gray-900 dark:text-white">
                Active Sessions
              </h4>
              <Button
                variant="secondary"
                onClick={() => setShowAllSessionsSection(!showAllSessionsSection)}
              >
                {showAllSessionsSection ? 'Hide' : 'Show'} Sessions
              </Button>
            </div>

            {showAllSessionsSection && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  View and deactivate sessions. Deactivated sessions are excluded from statistics.
                </p>

                {isLoadingActiveSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : activeSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No sessions found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Array.from(groupSessionsByProject(activeSessions).entries()).map(([projectId, sessions]) => {
                      const project = projects.find(p => p.id === projectId);
                      const isExpanded = expandedProjects.has(projectId);

                      return (
                        <div key={projectId} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                          <button
                            onClick={() => toggleProjectExpanded(projectId)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {project?.color && (
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getProjectName(projectId)}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({sessions.length} {sessions.length === 1 ? 'session' : 'sessions'})
                              </span>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="p-2 space-y-2">
                              {sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {session.description || 'No description'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDateTime(session.endTime || session.startTime)} • {formatDuration(session.duration || 0)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="danger"
                                    onClick={() => handleToggleDeactivation(session.id, false)}
                                  >
                                    Deactivate
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Deactivated Sessions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium text-gray-900 dark:text-white">
                Deactivated Sessions
              </h4>
              <Button
                variant="secondary"
                onClick={() => setShowDeactivatedSection(!showDeactivatedSection)}
              >
                {showDeactivatedSection ? 'Hide' : 'Show'} Sessions
              </Button>
            </div>

            {showDeactivatedSection && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Deactivated sessions are excluded from statistics but remain in your history.
                  You can reactivate them at any time.
                </p>

                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : deactivatedSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No deactivated sessions found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {deactivatedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {getProjectName(session.projectId)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {session.description && `${session.description} • `}
                            {formatDateTime(session.endTime || session.startTime)} • {formatDuration(session.duration || 0)}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => handleToggleDeactivation(session.id, true)}
                        >
                          Reactivate
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            About
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">Work Tracker</strong> - A time tracking application with cloud sync.
            </p>
            <p>
              Your projects and time entries are securely stored in Supabase. Active timer and settings are stored locally in your browser.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
