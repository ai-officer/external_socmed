import { useState, useEffect, useCallback } from 'react'

export interface AdminUser {
  id: string
  name: string | null
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  createdAt: string
  updatedAt: string
  _count: {
    files: number
    folders: number
  }
}

export interface UsersPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface UsersResponse {
  users: AdminUser[]
  pagination: UsersPagination
}

export interface CreateAdminData {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'SUPER_ADMIN'
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<UsersPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (params: {
    page?: number
    limit?: number
    search?: string
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'all'
  } = {}) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.search) searchParams.set('search', params.search)
      if (params.role) searchParams.set('role', params.role)

      const response = await fetch(`/api/admin/users?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const createAdmin = useCallback(async (adminData: CreateAdminData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create admin')
      }

      const data = await response.json()
      
      // Refresh users list
      fetchUsers()
      
      return data.user
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchUsers])

  const updateUserRole = useCallback(async (userId: string, role: 'SUPER_ADMIN' | 'ADMIN' | 'USER') => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user role')
      }

      const data = await response.json()
      
      // Update user in local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? data.user : user
        )
      )
      
      return data.user
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteUser = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    pagination,
    loading,
    error,
    fetchUsers,
    createAdmin,
    updateUserRole,
    deleteUser,
  }
}
