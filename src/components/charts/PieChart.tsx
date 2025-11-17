interface PieChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  size?: number;
  showLegend?: boolean;
}

export const PieChart = ({ data, size = 200, showLegend = true }: PieChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const center = size / 2;
  const radius = size / 2 - 10;
  let currentAngle = -90; // Start at top

  const paths: Array<{ path: string; color: string; label: string; percentage: number }> = [];

  data.forEach((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;

    if (percentage > 0) {
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      paths.push({
        path,
        color: item.color || '#3B82F6',
        label: item.label,
        percentage,
      });

      currentAngle += angle;
    }
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((item, index) => (
          <path
            key={index}
            d={item.path}
            fill={item.color}
            stroke="white"
            strokeWidth="2"
            className="transition-opacity duration-200 hover:opacity-80"
          />
        ))}
      </svg>
      {showLegend && (
        <div className="mt-4 space-y-2 w-full">
          {paths.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


