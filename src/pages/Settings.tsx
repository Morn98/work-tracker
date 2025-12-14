import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Header, Card, Button } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
// TODO: Re-implement export/import with database functions
// import { exportToJSON, getExportSummary } from '../utils/exportData';
// import {
//   parseImportFile,
//   importData,
//   getImportSummary,
//   type ImportOptions,
//   type ValidationResult,
// } from '../utils/importData';
// import type { ExportData } from '../types';
import { clearLocalStorage } from '../lib/storage';
import { showSuccess, showError } from '../utils/errorHandler';
import { getTimeEntries, toggleTimeEntryDeactivation, getProjects } from '../lib/database';
import { formatDateTime, formatDuration } from '../utils/formatTime';
import type { TimeEntry, Project } from '../types';

export const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deactivatedSessions, setDeactivatedSessions] = useState<TimeEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingActiveSessions, setIsLoadingActiveSessions] = useState(false);
  const [showDeactivatedSection, setShowDeactivatedSection] = useState(false);
  const [showAllSessionsSection, setShowAllSessionsSection] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // TODO: Re-implement export/import functionality
  // const [showExportPreview, setShowExportPreview] = useState(false);
  // const [importFile, setImportFile] = useState<ExportData | null>(null);
  // const [importValidation, setImportValidation] = useState<ValidationResult | null>(null);
  // const [showImportPreview, setShowImportPreview] = useState(false);
  // const [mergeStrategy, setMergeStrategy] = useState<'replace' | 'append'>('append');
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // const handleExportData = async () => {
  //   try {
  //     await exportToJSON(false);
  //     showSuccess('Data exported successfully!');
  //   } catch (error) {
  //     console.error('Export error:', error);
  //     showError('Failed to export data. Please try again.');
  //   }
  // };

  const handleClearData = () => {
    try {
      clearLocalStorage();
      showSuccess('Local storage cleared successfully!');
      setShowClearConfirm(false);
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error('Clear data error:', error);
      showError('Failed to clear local storage. Please try again.');
    }
  };

  // TODO: Re-implement these functions
  // const toggleExportPreview = () => {
  //   setShowExportPreview(!showExportPreview);
  // };
  // const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => { ... };
  // const handleImportData = () => { ... };
  // const handleCancelImport = () => { ... };

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

            {/* TODO: Re-implement Import/Export functionality with database */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Import/Export functionality is temporarily disabled during database migration. Your data is safely stored in Supabase.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {!showClearConfirm ? (
                <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
                  🗑️ Clear Local Storage
                </Button>
              ) : (
                <>
                  <Button variant="danger" onClick={handleClearData}>
                    ⚠️ Confirm Delete
                  </Button>
                  <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Clear All Data will only clear your local browser storage (active timer and settings). Your projects and time entries in the database will not be affected.
              </p>
            </div>
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
