'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminUsers, AdminUser, CreateAdminData } from '@/hooks/useAdminUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { User, Crown, Shield, Search, Plus, Trash2, Edit, FileText, Folder } from 'lucide-react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'

const roleColors = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  USER: 'bg-gray-100 text-gray-800',
}

const roleIcons = {
  SUPER_ADMIN: Crown,
  ADMIN: Shield,
  USER: User,
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const { users, pagination, loading, error, fetchUsers, createAdmin, updateUserRole, deleteUser } = useAdminUsers()
  
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'SUPER_ADMIN' | 'ADMIN' | 'USER'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState<CreateAdminData>({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN'
  })

  // Check if user has permission to access this page
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSearch = () => {
    fetchUsers({ search, role: roleFilter, page: 1 })
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAdmin(createFormData)
      setIsCreateDialogOpen(false)
      setCreateFormData({ name: '', email: '', password: '', role: 'ADMIN' })
    } catch (error) {
      console.error('Failed to create admin:', error)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'SUPER_ADMIN' | 'ADMIN' | 'USER') => {
    try {
      await updateUserRole(userId, newRole)
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const canEditUser = (user: AdminUser) => {
    if (session?.user?.role === 'SUPER_ADMIN') return true
    if (session?.user?.role === 'ADMIN' && user.role === 'USER') return true
    return false
  }

  const canDeleteUser = (user: AdminUser) => {
    return session?.user?.role === 'SUPER_ADMIN' && user.id !== session.user.id
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage user accounts and permissions</p>
              </div>
              
              {session?.user?.role === 'SUPER_ADMIN' && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Admin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={createFormData.name}
                          onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={createFormData.email}
                          onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={createFormData.password}
                          onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={createFormData.role} onValueChange={(value: 'ADMIN' | 'SUPER_ADMIN') => setCreateFormData({ ...createFormData, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          Create Admin
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Users</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Role Filter</Label>
                    <Select value={roleFilter} onValueChange={(value: typeof roleFilter) => setRoleFilter(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="USER">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSearch} disabled={loading}>
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Users ({pagination.total})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">User</th>
                          <th className="text-left py-3 px-4">Role</th>
                          <th className="text-left py-3 px-4">Files</th>
                          <th className="text-left py-3 px-4">Folders</th>
                          <th className="text-left py-3 px-4">Created</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => {
                          const RoleIcon = roleIcons[user.role]
                          return (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={roleColors[user.role]}>
                                  <RoleIcon className="w-3 h-3 mr-1" />
                                  {user.role.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center text-gray-600">
                                  <FileText className="w-4 h-4 mr-1" />
                                  {user._count.files}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center text-gray-600">
                                  <Folder className="w-4 h-4 mr-1" />
                                  {user._count.folders}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-600">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  {canEditUser(user) && (
                                    <Select
                                      value={user.role}
                                      onValueChange={(value: 'SUPER_ADMIN' | 'ADMIN' | 'USER') => handleRoleChange(user.id, value)}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {session?.user?.role === 'SUPER_ADMIN' && (
                                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                        )}
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="USER">User</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                  
                                  {canDeleteUser(user) && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete {user.name}? This action cannot be undone and will delete all their files and folders.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">
                      Showing {users.length} of {pagination.total} users
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrev}
                        onClick={() => fetchUsers({ search, role: roleFilter, page: pagination.page - 1 })}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNext}
                        onClick={() => fetchUsers({ search, role: roleFilter, page: pagination.page + 1 })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
