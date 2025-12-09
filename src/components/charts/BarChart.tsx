interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

export const BarChart = ({ data, maxValue, height = 200, showValues = true }: BarChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;
  const padding = 2;
  const topPadding = 15; // Space for value labels at the top
  const bottomPadding = 10;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        {data.map((item, index) => {
          const barHeight = max > 0 ? (item.value / max) * (height - topPadding - bottomPadding) : 0;
          const x = (index * barWidth) + padding;
          const width = barWidth - (padding * 2);
          const y = height - barHeight - bottomPadding;
          const color = item.color || '#3B82F6';

          return (
            <g key={index}>
              <rect
                x={`${x}%`}
                y={y}
                width={`${width}%`}
                height={barHeight}
                fill={color}
                rx="2"
                className="transition-all duration-300"
              />
              {showValues && item.value > 0 && (
                <text
                  x={`${x + width / 2}%`}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="8"
                  fill="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                >
                  {item.value > 0 ? Math.round(item.value) : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        {data.map((item, index) => (
          <span key={index} className="truncate" style={{ width: `${barWidth}%` }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

