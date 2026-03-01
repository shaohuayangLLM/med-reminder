import { AlertLevel } from '../lib/alert-level'

interface RingProgressProps {
  remaining: number
  total: number
  alertLevel: AlertLevel
}

export function RingProgress({ remaining, total, alertLevel }: RingProgressProps) {
  const radius = 80
  const strokeWidth = 8
  const size = 200
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? Math.max(0, remaining / total) : 0
  const offset = circumference * (1 - progress)

  const colors = {
    [AlertLevel.None]: { fg: '#000000', bg: 'rgba(0,0,0,0.06)' },
    [AlertLevel.Warning]: { fg: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
    [AlertLevel.Urgent]: { fg: '#FF3B30', bg: 'rgba(255,59,48,0.12)' },
  }

  const { fg, bg } = colors[alertLevel]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        stroke={bg}
      />
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke={fg}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease' }}
      />
    </svg>
  )
}
