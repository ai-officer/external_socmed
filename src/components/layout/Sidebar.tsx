'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Upload, 
  FolderOpen, 
  Search,
  Tag,
  Settings,
  Users,
  BarChart3,
  FileText,
  Shield
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Folders', href: '/folders', icon: FolderOpen },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Tags', href: '/tags', icon: Tag },
]

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href))
  }

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <div className="ml-3">
                <span className="text-lg font-bold text-gray-900 block">CONTENT</span>
                <span className="text-lg font-bold text-gray-900 block -mt-1">MANAGER</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            ))}
            
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') && (
              <>
                <div className="mt-8">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </h3>
                  <div className="mt-2 space-y-1">
                    {adminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                          )}
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}