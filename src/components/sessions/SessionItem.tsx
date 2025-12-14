import { formatDuration, formatDateTime } from '../../utils/formatTime';
import type { TimeEntry } from '../../types';

interface SessionItemProps {
  session: TimeEntry;
  projectName: string;
  projectColor?: string;
}

export const SessionItem = ({ session, projectName, projectColor }: SessionItemProps) => {
  const isDeactivated = session.isDeactivated || false;

  return (
    <div
      className={`
        p-4 border rounded-lg transition-colors
        ${
          isDeactivated
            ? 'opacity-50 grayscale bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {projectColor && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: projectColor }}
              />
            )}
            <h4
              className={`font-medium ${
                isDeactivated
                  ? 'text-gray-500 dark:text-gray-500 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {projectName}
            </h4>
            {session.description && (
              <span
                className={`text-sm ${
                  isDeactivated
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                • {session.description}
              </span>
            )}
            {isDeactivated && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                Deactivated
              </span>
            )}
          </div>
          {session.endTime && (
            <p
              className={`text-sm ${
                isDeactivated
                  ? 'text-gray-400 dark:text-gray-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {formatDateTime(session.endTime)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p
            className={`text-lg font-semibold ${
              isDeactivated
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {session.duration ? formatDuration(session.duration) : '0s'}
          </p>
        </div>
      </div>
    </div>
  );
};


