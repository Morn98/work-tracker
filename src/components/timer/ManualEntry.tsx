import { useState } from 'react';
import { Card, Button } from '../ui';
import { formatDuration } from '../../utils/formatTime';

interface ManualEntryProps {
  onSave?: (duration: number, startTime: number, endTime: number) => void;
}

/**
 * Component for manually entering time worked
 * Allows users to input start time, end time, and optional break duration
 */
export const ManualEntry = ({ onSave }: ManualEntryProps) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('');
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Parse time string (HH:MM) and return minutes since midnight
   */
  const parseTimeToMinutes = (timeString: string): number | null => {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    return hours * 60 + minutes;
  };

  /**
   * Calculate worked time from start, end, and break duration
   */
  const calculateWorkedTime = () => {
    setError(null);
    setCalculatedDuration(null);

    // Validate inputs
    if (!startTime || !endTime) {
      setError('Please enter both start and end times');
      return;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (startMinutes === null || endMinutes === null) {
      setError('Please enter valid times in HH:MM format');
      return;
    }

    // Handle case where end time is on the next day
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) {
      // End time is on the next day
      totalMinutes += 24 * 60;
    }

    // Subtract break duration if provided
    const breakDuration = breakMinutes ? parseInt(breakMinutes, 10) : 0;
    if (breakDuration < 0) {
      setError('Break duration cannot be negative');
      return;
    }

    if (breakDuration > totalMinutes) {
      setError('Break duration cannot exceed total worked time');
      return;
    }

    const workedMinutes = totalMinutes - breakDuration;
    const workedSeconds = workedMinutes * 60;

    if (workedSeconds <= 0) {
      setError('Total worked time must be greater than zero');
      return;
    }

    setCalculatedDuration(workedSeconds);

    // If onSave callback is provided, call it with the calculated values
    if (onSave) {
      // Create Date objects for start and end times (using today's date)
      const today = new Date();
      const [startHours, startMins] = startTime.split(':').map(Number);
      const [endHours, endMins] = endTime.split(':').map(Number);

      const startDate = new Date(today);
      startDate.setHours(startHours, startMins, 0, 0);

      let endDate = new Date(today);
      endDate.setHours(endHours, endMins, 0, 0);

      // If end time is earlier than start time, assume it's the next day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      onSave(workedSeconds, startDate.getTime(), endDate.getTime());
    }
  };

  const handleReset = () => {
    setStartTime('');
    setEndTime('');
    setBreakMinutes('');
    setCalculatedDuration(null);
    setError(null);
  };

  return (
    <Card padding="lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Manual Time Entry
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Add time manually by entering start and end times
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Format: HH:MM</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Format: HH:MM</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Break Duration (minutes)
          </label>
          <input
            type="number"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional: Enter break duration in minutes</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {calculatedDuration !== null && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Total Worked Time</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {startTime} - {endTime}
                  {breakMinutes && ` (${breakMinutes} min break)`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatDuration(calculatedDuration)}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {(calculatedDuration / 3600).toFixed(2)} hours
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={calculateWorkedTime} fullWidth>
            Calculate
          </Button>
          <Button variant="secondary" onClick={handleReset} fullWidth>
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};

