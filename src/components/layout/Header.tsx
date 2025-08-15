'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Search, Bell, Moon, Sun, Menu, X } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()
  const [isDark, setIsDark] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Title */}
          <div className="flex-1 lg:flex-none">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Search bar */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-12">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search files, folders..."
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <button className="p-3 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="h-6 w-6" />
            </button>

            {/* Theme toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-3 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>

            {/* User menu */}
            {session && (
              <div className="relative flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-medium">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{session.user.role?.toLowerCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
