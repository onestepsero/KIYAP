interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  icon?: React.ReactNode
}

const COLOR_MAP = {
  blue: 'bg-blue-50 border-blue-100',
  green: 'bg-green-50 border-green-100',
  purple: 'bg-purple-50 border-purple-100',
  orange: 'bg-orange-50 border-orange-100',
  red: 'bg-red-50 border-red-100',
}

const TEXT_MAP = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
}

export default function StatsCard({ title, value, subtitle, color = 'blue', icon }: StatsCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${COLOR_MAP[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${TEXT_MAP[color]}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className={`${TEXT_MAP[color]} opacity-70`}>{icon}</div>}
      </div>
    </div>
  )
}
