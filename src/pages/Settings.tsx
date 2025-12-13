import { useState, useRef } from 'react';
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
import { clearAllData } from '../lib/storage';
import { showSuccess, showError } from '../utils/errorHandler';

export const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<ExportData | null>(null);
  const [importValidation, setImportValidation] = useState<ValidationResult | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [mergeStrategy, setMergeStrategy] = useState<'replace' | 'append'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    try {
      exportToJSON(false); // Don't include settings by default
      showSuccess('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export data. Please try again.');
    }
  };

  const handleClearData = () => {
    try {
      clearAllData();
      showSuccess('All data cleared successfully!');
      setShowClearConfirm(false);
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error('Clear data error:', error);
      showError('Failed to clear data. Please try again.');
    }
  };

  const toggleExportPreview = () => {
    setShowExportPreview(!showExportPreview);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showError('Please select a valid JSON file');
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const { data, validation } = parseImportFile(content);

        setImportValidation(validation);

        if (validation.valid && data) {
          setImportFile(data);
          setShowImportPreview(true);
        } else {
          setImportFile(null);
          setShowImportPreview(false);
          // Show first error
          if (validation.errors.length > 0) {
            showError(validation.errors[0]);
          }
        }
      } catch (error) {
        console.error('File read error:', error);
        showError('Failed to read file. Please try again.');
        setImportFile(null);
        setImportValidation(null);
      }
    };

    reader.onerror = () => {
      showError('Failed to read file. Please try again.');
    };

    reader.readAsText(file);
  };

  const handleImportData = () => {
    if (!importFile) {
      showError('No file selected');
      return;
    }

    const options: ImportOptions = {
      mergeStrategy,
      includeSettings: false,
    };

    const result = importData(importFile, options);

    if (result.success) {
      showSuccess(
        `Import successful! ${result.projectsImported} projects and ${result.entriesImported} time entries imported.`
      );

      // Show warnings if any
      if (result.errors.length > 0) {
        result.errors.forEach((error) => console.warn('Import warning:', error));
      }

      // Reset import state
      setImportFile(null);
      setImportValidation(null);
      setShowImportPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showError(result.errors[0] || 'Import failed. Please try again.');
    }
  };

  const handleCancelImport = () => {
    setImportFile(null);
    setImportValidation(null);
    setShowImportPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              All your data is stored locally in your browser. You can export, import, or clear your data here.
            </p>

            {/* Import Section */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Import Data
              </h4>

              <div className="space-y-3">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-600 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      dark:file:bg-blue-900/30 dark:file:text-blue-300
                      hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                      file:cursor-pointer cursor-pointer
                      transition-all"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Select a Work Tracker export file (.json)
                  </p>
                </div>

                {/* Import Preview */}
                {showImportPreview && importFile && importValidation && (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-mono">
                        {getImportSummary(importFile)}
                      </pre>
                    </div>

                    {/* Validation Warnings */}
                    {importValidation.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Warnings:
                        </p>
                        <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                          {importValidation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Merge Strategy */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Import Strategy
                      </label>
                      <select
                        value={mergeStrategy}
                        onChange={(e) => setMergeStrategy(e.target.value as 'replace' | 'append')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="append">Merge with existing data (recommended)</option>
                        <option value="replace">Replace all existing data</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {mergeStrategy === 'append'
                          ? 'Existing data will be preserved. Conflicts will be resolved by keeping the imported version.'
                          : 'All existing data will be deleted and replaced with the imported data.'}
                      </p>
                    </div>

                    {/* Import Actions */}
                    <div className="flex gap-3">
                      <Button onClick={handleImportData} size="sm">
                        Import Data
                      </Button>
                      <Button variant="secondary" onClick={handleCancelImport} size="sm">
                        Cancel
                      </Button>
                    </div>

                    {mergeStrategy === 'replace' && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs text-red-800 dark:text-red-200">
                          <strong>Warning:</strong> Replace mode will permanently delete all your existing projects and time entries.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Export Preview */}
            {showExportPreview && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-mono">
                  {getExportSummary()}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="secondary" onClick={handleExportData}>
                📥 Export Data
              </Button>
              <Button
                variant="secondary"
                onClick={toggleExportPreview}
                className="sm:max-w-fit"
              >
                {showExportPreview ? 'Hide' : 'Preview'} Export
              </Button>
              {!showClearConfirm ? (
                <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
                  🗑️ Clear All Data
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
                <strong>Warning:</strong> Clearing all data will permanently delete all your projects, time entries, and settings. This action cannot be undone.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            About
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">Work Tracker</strong> - A simple, client-side time tracking application.
            </p>
            <p>
              All data is stored locally in your browser. No data is sent to any server.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
