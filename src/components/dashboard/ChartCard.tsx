import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  children: ReactNode
  className?: string
}

export default function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}
