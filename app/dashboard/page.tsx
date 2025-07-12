'use client'

/**
 * User Dashboard Page (Default Dashboard)
 *
 * Halaman dashboard utama untuk semua authenticated users.
 * Dapat diakses oleh user, creator, dan admin dengan konten yang sesuai role.
 */

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { BookOpen, User, Star, Clock, Award } from 'lucide-react'
import { useUserRole, useRoleGuard, useRoleLoadingState } from '@/features/auth'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const { role } = useUserRole()
  const { canAccessUser } = useRoleGuard()
  const { shouldShowLoader: roleLoading } = useRoleLoadingState()

  if (!isLoaded || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Client-side role check - all authenticated users can access dashboard
  if (!canAccessUser()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda perlu login untuk mengakses dashboard.</p>
          <p className="text-sm text-gray-500 mt-2">Role saat ini: {role || 'Tidak ada'}</p>
          <div className="mt-4">
            <Link href="/sign-in">
              <Button>Login</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Mock user data
  const userStats = {
    coursesEnrolled: 5,
    coursesCompleted: 2,
    totalLearningHours: 24,
    certificatesEarned: 1,
  }

  const recentCourses = [
    {
      id: 1,
      title: 'Introduction to React',
      progress: 75,
      lastAccessed: '2024-01-15',
      instructor: 'John Doe',
    },
    {
      id: 2,
      title: 'JavaScript Fundamentals',
      progress: 100,
      lastAccessed: '2024-01-14',
      instructor: 'Jane Smith',
    },
    {
      id: 3,
      title: 'CSS Grid & Flexbox',
      progress: 45,
      lastAccessed: '2024-01-13',
      instructor: 'Bob Johnson',
    },
  ]

  // Get dashboard title based on role
  const getDashboardTitle = () => {
    switch (role) {
      case 'admin':
        return 'Dashboard Admin'
      case 'creator':
        return 'Dashboard Creator'
      default:
        return 'Dashboard Learner'
    }
  }

  // Get role-specific quick actions
  const getRoleBasedActions = () => {
    const commonActions = [
      {
        icon: <BookOpen className="w-4 h-4 mr-2" />,
        label: 'Jelajahi Kursus Baru',
        href: '/courses',
      },
      {
        icon: <User className="w-4 h-4 mr-2" />,
        label: 'Edit Profile',
        href: '/profile',
      },
      {
        icon: <Star className="w-4 h-4 mr-2" />,
        label: 'Lihat Sertifikat',
        href: '/profile/certificates',
      },
    ]

    if (role === 'admin') {
      return [
        {
          icon: <User className="w-4 h-4 mr-2" />,
          label: 'Admin Panel',
          href: '/admin/dashboard',
        },
        ...commonActions,
      ]
    }

    if (role === 'creator') {
      return [
        {
          icon: <BookOpen className="w-4 h-4 mr-2" />,
          label: 'Creator Studio',
          href: '/creator/dashboard',
        },
        ...commonActions,
      ]
    }

    return commonActions
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
              <p className="text-gray-600">
                Selamat datang kembali, {user?.firstName || 'User'}! - Role:{' '}
                <span className="font-semibold capitalize text-blue-600">{role}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kursus Diikuti</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.coursesEnrolled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kursus Selesai</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.coursesCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Jam Belajar</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalLearningHours}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sertifikat</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.certificatesEarned}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Kursus Terbaru</h2>
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </div>
          </div>

          <div className="divide-y">
            {recentCourses.map((course) => (
              <div key={course.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">Instruktur: {course.instructor}</p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{course.progress}%</span>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Terakhir diakses: {course.lastAccessed}
                    </p>
                  </div>

                  <div className="ml-4">
                    <Button variant="outline" size="sm">
                      {course.progress === 100 ? 'Review' : 'Lanjutkan'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="space-y-3">
              {getRoleBasedActions().map((action, index) => (
                <Link key={index} href={action.href} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    {action.icon}
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Rekomendasi</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Advanced React Patterns</h4>
                <p className="text-sm text-blue-700">Berdasarkan progress React Anda</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Node.js Backend Development</h4>
                <p className="text-sm text-green-700">Melengkapi skill frontend Anda</p>
              </div>
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
                <strong>Can Access Dashboard:</strong> {canAccessUser() ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Route:</strong> /dashboard
              </div>
              <div>
                <strong>Middleware Check:</strong> Passed (reached this page)
              </div>
              <div>
                <strong>Required Roles:</strong> [&lsquo;user&rsquo;, &lsquo;creator&rsquo;,
                &lsquo;admin&rsquo;]
              </div>
              <div>
                <strong>App Structure:</strong> Simplified (no /user folder)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
