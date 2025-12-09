import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const Header = ({ title, description, action, className = '' }: HeaderProps) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {action && <div>{action}</div>}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            v{__APP_VERSION__}
          </div>
        </div>
      </div>
    </div>
  );
};

