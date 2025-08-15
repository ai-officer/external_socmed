'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StatsWidgetProps {
  title: string
  value: string
  change?: string
  icon: LucideIcon
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function StatsWidget({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-gray-600',
  trend = 'neutral'
}: StatsWidgetProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={cn(
                "text-sm mt-1",
                trend === 'up' && "text-green-600",
                trend === 'down' && "text-red-600",
                trend === 'neutral' && "text-gray-500"
              )}>
                {change}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-full bg-gray-100",
            iconColor
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}