import { useState } from 'react';
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

export const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
