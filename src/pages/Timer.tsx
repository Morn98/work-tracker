import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer, Header, Card, Button } from '../components/ui';
import { SessionItem } from '../components/sessions';
import { ManualEntry } from '../components/timer';
import { useTimer } from '../hooks/useTimer';
import { useProjects } from '../hooks/useProjects';
import { useTodaySessions } from '../hooks/useTodaySessions';
import { saveTimeEntry } from '../lib/database';
import { getActiveTimer } from '../lib/storage';
import { formatTime } from '../utils/formatTime';
import { showError, showSuccess } from '../utils/errorHandler';
import type { TimeEntry } from '../types';

export const Timer = () => {
  const { elapsedTime, state, currentEntry, start, pause, resume, stop } = useTimer();
  const { projects } = useProjects();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { sessions: todaySessions } = useTodaySessions(refreshTrigger);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Load current entry data when timer is active
  useEffect(() => {
    if (currentEntry) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProjectId((prev) => currentEntry.projectId !== prev ? currentEntry.projectId : prev);
      setDescription((prev) => (currentEntry.description || '') !== prev ? (currentEntry.description || '') : prev);
    }
  }, [currentEntry]);

  // Refresh sessions list when timer stops (state changes to idle)
  useEffect(() => {
    if (state === 'idle') {
      // Small delay to ensure the session is saved before refreshing
      const timeoutId = setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [state]);

  const handleStart = () => {
    if (!selectedProjectId) {
      showError('Please select a project');
      return;
    }

    // NEW: Check for timer in another tab
    const activeTimer = getActiveTimer();
    if (activeTimer && !activeTimer.endTime && activeTimer.id !== currentEntry?.id) {
      showError('A timer is already running in another tab. Please stop it first.');
      return;
    }

    start(selectedProjectId, description || undefined);
  };

  const handleStop = async () => {
    await stop();
    setSelectedProjectId('');
    setDescription('');
    // Refresh sessions list after stopping timer
    setRefreshTrigger((prev) => prev + 1);
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getProjectColor = (projectId: string): string | undefined => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color;
  };

  const handleManualEntrySave = async (duration: number, startTime: number, endTime: number) => {
    if (!selectedProjectId) {
      showError('Please select a project first');
      return;
    }

    const now = Date.now();
    const manualEntry: TimeEntry = {
      id: `manual-${now}`,
      projectId: selectedProjectId,
      startTime,
      endTime,
      duration,
      description: description || undefined,
      createdAt: now,
      updatedAt: now,
      isManual: true,
    };

    try {
      await saveTimeEntry(manualEntry);
      showSuccess('Manual time entry saved successfully!');
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      // Error already shown by database layer
    }
  };

  const isRunning = state === 'running';
  const isPaused = state === 'paused';
  const isIdle = state === 'idle';

  // Get current project info for display
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <PageContainer>
      <Header title="Timer" description="Track your work time" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timer, Project Selection, and Manual Entry */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer Display Card */}
            <Card padding="lg" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                {/* Timer Display */}
                <div className="mb-6">
                  <div className="text-7xl font-mono font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                    {formatTime(elapsedTime)}
                  </div>
                  
                  {/* Current Project Badge */}
                  {currentProject && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-full mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentProject.color || '#3B82F6' }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentProject.name}
                      </span>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isIdle ? 'bg-gray-400' :
                      isRunning ? 'bg-green-500 animate-pulse' :
                      'bg-yellow-500'
                    }`} />
                    <p className={`text-sm font-medium uppercase tracking-wide ${
                      isIdle ? 'text-gray-600 dark:text-gray-400' :
                      isRunning ? 'text-green-600 dark:text-green-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {isIdle && 'Ready to start'}
                      {isRunning && 'Timer running'}
                      {isPaused && 'Timer paused'}
                    </p>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="flex justify-center gap-3">
                  {isIdle && (
                    <Button 
                      size="lg" 
                      onClick={handleStart} 
                      disabled={!selectedProjectId}
                      className="min-w-[200px] shadow-lg"
                    >
                      ▶ Start Timer
                    </Button>
                  )}
                  {isRunning && (
                    <>
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={pause}
                        className="min-w-[140px]"
                      >
                        ⏸ Pause
                      </Button>
                      <Button
                        size="lg"
                        variant="success"
                        onClick={handleStop}
                        className="min-w-[140px]"
                      >
                        ✓ Finished
                      </Button>
                    </>
                  )}
                  {isPaused && (
                    <>
                      <Button
                        size="lg"
                        onClick={resume}
                        className="min-w-[140px]"
                      >
                        ▶ Resume
                      </Button>
                      <Button
                        size="lg"
                        variant="success"
                        onClick={handleStop}
                        className="min-w-[140px]"
                      >
                        ✓ Finished
                      </Button>
                    </>
                  )}
                </div>

                {/* Active Session Info */}
                {currentEntry && !isIdle && (
                  <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
                    <div className="text-left max-w-md mx-auto">
                      {currentEntry.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <span className="font-medium">Task:</span> {currentEntry.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Started at {new Date(currentEntry.startTime).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Project Selection Card */}
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Project & Description
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={!isIdle}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {projects.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      No projects yet.{' '}
                      <Link to="/projects" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        Create one →
                      </Link>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What are you working on?"
                    disabled={!isIdle}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </Card>

            {/* Manual Entry Card */}
            <ManualEntry onSave={handleManualEntrySave} />
          </div>

          {/* Right Column - Today's Sessions */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Today's Sessions
                </h3>
                {todaySessions.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {todaySessions.length}
                  </span>
                )}
              </div>

              {todaySessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">⏱️</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    No sessions today
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Start tracking to see sessions here
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {todaySessions.map((session: TimeEntry) => (
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
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
