import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange';
  hover?: boolean;
}

const colorClasses = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  purple: 'text-purple-600 dark:text-purple-400',
  red: 'text-red-600 dark:text-red-400',
  orange: 'text-orange-600 dark:text-orange-400',
};

export const StatCard = ({ label, value, description, icon, color = 'blue', hover = false }: StatCardProps) => {
  return (
    <Card hover={hover}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className={`text-4xl font-bold ${colorClasses[color]} mb-1`}>{value}</p>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </Card>
  );
};

