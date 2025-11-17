import { formatDuration, formatDateTime } from '../../utils/formatTime';
import type { TimeEntry } from '../../types';

interface SessionItemProps {
  session: TimeEntry;
  projectName: string;
  projectColor?: string;
}

export const SessionItem = ({ session, projectName, projectColor }: SessionItemProps) => {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {projectColor && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: projectColor }}
              />
            )}
            <h4 className="font-medium text-gray-900 dark:text-white">{projectName}</h4>
            {session.description && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {session.description}
              </span>
            )}
          </div>
          {session.endTime && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDateTime(session.endTime)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {session.duration ? formatDuration(session.duration) : '0s'}
          </p>
        </div>
      </div>
    </div>
  );
};


