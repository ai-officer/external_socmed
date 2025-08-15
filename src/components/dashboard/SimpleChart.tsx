interface DataPoint {
  label: string
  value: number
}

interface SimpleChartProps {
  data: DataPoint[]
  type: 'bar' | 'line'
  height?: number
}

export default function SimpleChart({ data, type, height = 200 }: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  if (type === 'bar') {
    return (
      <div className="w-full" style={{ height }}>
        <div className="flex items-end justify-between h-full space-x-2">
          {data.map((point, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                style={{ 
                  height: `${(point.value / maxValue) * 80}%`,
                  minHeight: '4px'
                }}
              />
              <span className="text-xs text-gray-500 mt-2 text-center">{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Simple line chart representation
  return (
    <div className="w-full" style={{ height }}>
      <div className="relative h-full">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 40}
              x2="400"
              y2={i * 40}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="url(#lineGradient)"
            stroke="#3B82F6"
            strokeWidth="2"
            points={data.map((point, index) => 
              `${(index / (data.length - 1)) * 400},${200 - (point.value / maxValue) * 160}`
            ).join(' ')}
          />
          
          {/* Data points */}
          {data.map((point, index) => (
            <circle
              key={index}
              cx={(index / (data.length - 1)) * 400}
              cy={200 - (point.value / maxValue) * 160}
              r="4"
              fill="#3B82F6"
            />
          ))}
        </svg>
        
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between">
          {data.map((point, index) => (
            <span key={index} className="text-xs text-gray-500">{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
