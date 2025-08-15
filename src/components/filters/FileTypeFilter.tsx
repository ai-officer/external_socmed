'use client'

import { Label } from '@/components/ui/label'
import { 
  FileImage, 
  FileVideo, 
  FileText, 
  Grid3X3
} from 'lucide-react'

interface FileTypeFilterProps {
  value?: string
  onChange: (value?: string) => void
}

const fileTypes = [
  { 
    value: 'all', 
    label: 'All Files', 
    icon: Grid3X3,
    description: 'Show all file types'
  },
  { 
    value: 'image', 
    label: 'Images', 
    icon: FileImage,
    description: 'JPG, PNG, GIF, SVG'
  },
  { 
    value: 'video', 
    label: 'Videos', 
    icon: FileVideo,
    description: 'MP4, MOV, AVI'
  },
  { 
    value: 'document', 
    label: 'Documents', 
    icon: FileText,
    description: 'PDF, DOC, TXT'
  }
]

export function FileTypeFilter({ value = 'all', onChange }: FileTypeFilterProps) {
  return (
    <div className="space-y-2">
      {fileTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.value
        
        return (
          <div 
            key={type.value} 
            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
            }`}
            onClick={() => onChange(type.value === 'all' ? undefined : type.value)}
          >
            <input
              type="radio"
              id={type.value}
              name="fileType"
              checked={isSelected}
              onChange={() => onChange(type.value === 'all' ? undefined : type.value)}
              className="text-blue-600"
            />
            <Label 
              htmlFor={type.value} 
              className="flex-1 cursor-pointer flex items-center gap-2"
            >
              <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
              <div className="flex-1">
                <div className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {type.label}
                </div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </div>
            </Label>
          </div>
        )
      })}
    </div>
  )
}