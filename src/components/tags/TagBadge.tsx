'use client'

import { cn } from '@/utils/cn'

interface TagBadgeProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  removable?: boolean
  onRemove?: () => void
  className?: string
}

export function TagBadge({ 
  name, 
  color, 
  size = 'md', 
  removable = false, 
  onRemove,
  className 
}: TagBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full text-white font-medium",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {name}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}