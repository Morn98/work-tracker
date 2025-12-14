import { useState, useEffect } from 'react';
import { PageContainer, Header, Card, StatCard } from '../components/ui';
import { BarChart, PieChart } from '../components/charts';
import {
  getWeeklyTotal,
  getMonthlyTotal,
  getMonthlyProjectStats,
  getDailyBreakdown,
  getTimeEntries,
} from '../lib/database';
import { showError } from '../utils/errorHandler';
import { formatDuration } from '../utils/formatTime';
import { SECONDS_PER_HOUR, TOP_PROJECTS_COUNT, DAILY_BREAKDOWN_DAYS } from '../constants';
import type { ProjectStats, DailyStats } from '../lib/database';

export const Statistics = () => {
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    try {
      // Load all statistics in parallel from server-side aggregations
      const [sessions, weekly, monthly, monthlyProjects, daily] = await Promise.all([
        getTimeEntries(),
        getWeeklyTotal(),
        getMonthlyTotal(),
        getMonthlyProjectStats(),
        getDailyBreakdown(DAILY_BREAKDOWN_DAYS),
      ]);

      setTotalSessionsCount(sessions.length);
      setWeeklyTotal(weekly);
      setMonthlyTotal(monthly);
      setProjectStats(monthlyProjects);
      setDailyBreakdown(daily);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load statistics';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for charts
  const projectChartData = projectStats.slice(0, TOP_PROJECTS_COUNT).map((stat) => ({
    label: stat.project_name,
    value: stat.total_time / SECONDS_PER_HOUR, // Convert to hours for display
    color: stat.project_color || '#3B82F6',
  }));

  const dailyChartData = dailyBreakdown.map((day) => ({
    label: day.day_name,
    value: day.total_time / SECONDS_PER_HOUR, // Convert to hours
    color: '#3B82F6',
  }));

  const pieChartData = projectStats.map((stat) => ({
    label: stat.project_name,
    value: stat.total_time,
    color: stat.project_color || '#3B82F6',
  }));

  const hasData = totalSessionsCount > 0;

  if (isLoading) {
    return (
      <PageContainer>
        <Header title="Statistics" description="View your time tracking insights" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Statistics" description="View your time tracking insights" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          label="Weekly Total"
          value={formatDuration(weeklyTotal)}
          description="This week's tracked time"
          icon="📅"
          color="blue"
          hover
        />
        <StatCard
          label="Monthly Total"
          value={formatDuration(monthlyTotal)}
          description="This month's tracked time"
          icon="📆"
          color="green"
          hover
        />
        <StatCard
          label="Total Sessions"
          value={totalSessionsCount}
          description="All time sessions"
          icon="📊"
          color="purple"
          hover
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Time by Project - Bar Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Time by Project (Top {TOP_PROJECTS_COUNT})
          </h3>
          {hasData && projectChartData.length > 0 ? (
            <div>
              <BarChart data={projectChartData} height={100} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Values shown in hours
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">📊</span>
              <p className="text-gray-500 dark:text-gray-400">
                No data available yet. Start tracking time to see statistics.
              </p>
            </div>
          )}
        </Card>

        {/* Daily Breakdown - Bar Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Breakdown (Last {DAILY_BREAKDOWN_DAYS} Days)
          </h3>
          {hasData && dailyChartData.length > 0 ? (
            <div>
              <BarChart data={dailyChartData} height={100} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Values shown in hours
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">📈</span>
              <p className="text-gray-500 dark:text-gray-400">
                No data available yet. Start tracking time to see daily breakdowns.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Project Distribution - Pie Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Project Distribution
        </h3>
        {hasData && pieChartData.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
            <PieChart data={pieChartData} size={200} showLegend={true} />
            <div className="flex-1 space-y-3">
              {projectStats.map((stat) => (
                <div
                  key={stat.project_id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stat.project_color || '#3B82F6' }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {stat.project_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.session_count} {stat.session_count === 1 ? 'session' : 'sessions'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDuration(stat.total_time)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {((stat.total_time / (monthlyTotal || 1)) * 100).toFixed(1)}% of month
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📅</span>
            <p className="text-gray-500 dark:text-gray-400">
              Start tracking time to see your project distribution here.
            </p>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
