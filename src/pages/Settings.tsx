import { PageContainer, Header, Card, Button } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';

export const Settings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <PageContainer>
      <Header
        title="Settings"
        description="Manage your application preferences"
      />

      <div className="max-w-3xl space-y-6">
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
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All your data is stored locally in your browser. You can export or clear your data here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="secondary">
                Export Data
              </Button>
              <Button variant="danger">
                Clear All Data
              </Button>
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
