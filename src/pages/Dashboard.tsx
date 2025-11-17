import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageContainer, Header, Card, StatCard, EmptyState } from '../components/ui';
import { SessionItem } from '../components/sessions';
import { getProjects, getSessions } from '../lib/storage';
import { getWeeklyTotal, getTodayTotal } from '../utils/statistics';
import { formatDuration } from '../utils/formatTime';
import { MAX_RECENT_SESSIONS } from '../constants';
import type { TimeEntry } from '../types';

export const Dashboard = () => {
  const location = useLocation();
  const [todayTotal, setTodayTotal] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [recentSessions, setRecentSessions] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; color?: string }>>([]);

  const loadData = () => {
    const sessions = getSessions();
    const loadedProjects = getProjects();

    setTodayTotal(getTodayTotal(sessions));
    setWeeklyTotal(getWeeklyTotal(sessions));
    setProjects(loadedProjects);

    // Get active projects (projects that have at least one session)
    const projectIdsWithSessions = new Set(sessions.map((s) => s.projectId));
    setActiveProjectsCount(projectIdsWithSessions.size);

    // Get recent sessions (most recent first, limit to MAX_RECENT_SESSIONS)
    const sortedSessions = sessions
      .filter((s) => s.endTime) // Only completed sessions
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
      .slice(0, MAX_RECENT_SESSIONS);
    setRecentSessions(sortedSessions);
  };

  useEffect(() => {
    loadData();

    // Refresh data when window gains focus (user might have added sessions in another tab)
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    // Also refresh periodically (every 10 seconds) to catch updates
    const interval = setInterval(loadData, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Refresh when component becomes visible (user navigates back to Dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Refresh when navigating to Dashboard (React Router location change)
  useEffect(() => {
    if (location.pathname === '/') {
      loadData();
    }
  }, [location.pathname]);

  const getProjectName = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getProjectColor = (projectId: string): string | undefined => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color;
  };

  return (
    <PageContainer>
      <Header
        title="Dashboard"
        description="Overview of your time tracking activities"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Today's Time"
          value={formatDuration(todayTotal)}
          description={todayTotal > 0 ? 'Time tracked today' : 'No time tracked today'}
          icon="📅"
          color="blue"
          hover
        />
        <StatCard
          label="This Week"
          value={formatDuration(weeklyTotal)}
          description={weeklyTotal > 0 ? 'Time tracked this week' : 'No time tracked this week'}
          icon="📆"
          color="green"
          hover
        />
        <StatCard
          label="Active Projects"
          value={activeProjectsCount}
          description={
            activeProjectsCount === 0
              ? 'No projects created yet'
              : `${activeProjectsCount} ${activeProjectsCount === 1 ? 'project' : 'projects'} with sessions`
          }
          icon="📁"
          color="purple"
          hover
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          {recentSessions.length === 0 ? (
            <EmptyState
              icon="⏱️"
              title="No recent activity"
              description="Start tracking your time to see it here."
            />
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  projectName={getProjectName(session.projectId)}
                  projectColor={getProjectColor(session.projectId)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/timer"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">⏱️</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Start Timer</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Begin tracking your work</p>
                </div>
              </div>
            </Link>
            <Link
              to="/projects"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📁</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Create Project</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add a new project to track</p>
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
