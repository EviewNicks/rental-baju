'use client'

/**
 * Admin Dashboard Page
 *
 * Halaman dashboard khusus untuk admin role.
 * Menampilkan tools dan fitur administrasi sistem.
 */

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Shield, Users, Settings, BarChart3, Database, AlertTriangle } from 'lucide-react'
import { useUserRole, useRoleGuard, useRoleLoadingState } from '@/features/auth'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { user, isLoaded } = useUser()
  const { role, isAdmin } = useUserRole()
  const { canAccessAdmin } = useRoleGuard()
  const { shouldShowLoader: roleLoading } = useRoleLoadingState()

  if (!isLoaded || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Client-side role check
  if (!canAccessAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin administrator.</p>
          <p className="text-sm text-gray-500 mt-2">Role saat ini: {role || 'Tidak ada'}</p>
        </div>
      </div>
    )
  }

  // Mock admin data
  const adminStats = {
    totalUsers: 2486,
    totalCourses: 142,
    activeCreators: 28,
    systemHealth: 98,
  }

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      description: '15 pengguna baru mendaftar',
      timestamp: '2024-01-15 14:30',
      severity: 'info',
    },
    {
      id: 2,
      type: 'course_published',
      description: 'Kursus "Advanced JavaScript" dipublikasi',
      timestamp: '2024-01-15 13:45',
      severity: 'success',
    },
    {
      id: 3,
      type: 'system_alert',
      description: 'Storage usage mencapai 85%',
      timestamp: '2024-01-15 12:15',
      severity: 'warning',
    },
  ]

  const systemAlerts = [
    {
      id: 1,
      title: 'High Storage Usage',
      message: 'Storage server mencapai 85% kapasitas',
      severity: 'warning',
      action: 'Expand Storage',
    },
    {
      id: 2,
      title: 'Pending Reviews',
      message: '12 kursus menunggu review',
      severity: 'info',
      action: 'Review Content',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
              <p className="text-gray-600">
                Selamat datang, {user?.firstName || 'Administrator'}! - Role:{' '}
                <span className="font-semibold capitalize text-red-600">{role}</span>
              </p>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                System Alerts
              </h2>
            </div>
            <div className="divide-y">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <Button variant="outline" size="sm">
                      {alert.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {adminStats.totalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{adminStats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Creators</p>
                <p className="text-2xl font-bold text-gray-900">{adminStats.activeCreators}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-gray-900">{adminStats.systemHealth}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </div>

          <div className="divide-y">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      activity.severity === 'success'
                        ? 'bg-green-400'
                        : activity.severity === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-blue-400'
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.severity === 'success'
                      ? 'bg-green-100 text-green-800'
                      : activity.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {activity.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </h3>
            <div className="space-y-3">
              <Link href="/admin/users" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Manage Users
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                Role Assignments
              </Button>
              <Button variant="outline" className="w-full justify-start">
                User Analytics
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Content Management
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Review Courses
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Content Moderation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Publishing Queue
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Settings
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Platform Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Security Config
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Backup & Recovery
              </Button>
            </div>
          </div>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">🔧 Development Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Current Role:</strong> {role}
              </div>
              <div>
                <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Can Access Admin:</strong> {canAccessAdmin() ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Route:</strong> /admin/dashboard
              </div>
              <div>
                <strong>Middleware Check:</strong> Passed (reached this page)
              </div>
              <div>
                <strong>Required Roles:</strong> [&lsquo;admin&rsquo;]
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
