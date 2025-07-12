'use client'

/**
 * Role Display Component
 *
 * Component demo untuk menampilkan informasi role pengguna
 * dan testing role management functionality
 */

import React from 'react'
import {
  useUserRole,
  useRoleGuard,
  useRoleLoadingState,
  useRoleConditional,
  useRoleErrorHandling,
} from '../hooks/useUserRole'

export function RoleDisplay() {
  const { role, isAdmin, isCreator, isUser, refreshRole } = useUserRole()
  const roleGuard = useRoleGuard()
  const { isLoading, shouldShowLoader, getStatusMessage } = useRoleLoadingState()
  const { renderForAdmin, renderForCreator, isFeatureEnabled } = useRoleConditional()
  const { hasError, getUserFriendlyError, retryRoleFetch } = useRoleErrorHandling()

  if (shouldShowLoader) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <div className="text-red-800 font-medium mb-2">Error Role Management</div>
        <div className="text-red-600 text-sm mb-3">{getUserFriendlyError()}</div>
        <button
          onClick={retryRoleFetch}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Basic Role Info */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Informasi Role</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Role Aktif:</span>
            <span
              className={`font-medium px-2 py-1 rounded text-xs ${
                role === 'admin'
                  ? 'bg-red-100 text-red-800'
                  : role === 'creator'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
              }`}
            >
              {role || 'Not Assigned'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="text-gray-900">{getStatusMessage()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Admin:</span>
            <span className={isAdmin ? 'text-green-600' : 'text-gray-400'}>
              {isAdmin ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Creator:</span>
            <span className={isCreator ? 'text-green-600' : 'text-gray-400'}>
              {isCreator ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">User:</span>
            <span className={isUser ? 'text-green-600' : 'text-gray-400'}>
              {isUser ? '✓' : '✗'}
            </span>
          </div>
        </div>

        <button
          onClick={refreshRole}
          disabled={isLoading}
          className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Role'}
        </button>
      </div>

      {/* Permission Examples */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Permission Examples</h3>
        <div className="space-y-2 text-sm">
          <PermissionItem label="Akses Admin Panel" allowed={roleGuard.canAccessAdmin()} />
          <PermissionItem label="Kelola Pengguna" allowed={roleGuard.canManageUsers()} />
          <PermissionItem label="Buat Konten" allowed={roleGuard.canCreateContent()} />
          <PermissionItem label="Akses Dashboard" allowed={roleGuard.canAccessDashboard()} />
          <PermissionItem label="Lihat Analytics" allowed={roleGuard.canAccessAnalytics()} />
        </div>
      </div>

      {/* Feature Flags */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Feature Access</h3>
        <div className="space-y-2 text-sm">
          <FeatureFlag
            feature="analytics"
            label="Analytics Dashboard"
            isEnabled={isFeatureEnabled('analytics')}
          />
          <FeatureFlag
            feature="content-management"
            label="Content Management"
            isEnabled={isFeatureEnabled('content-management')}
          />
          <FeatureFlag
            feature="user-management"
            label="User Management"
            isEnabled={isFeatureEnabled('user-management')}
          />
          <FeatureFlag
            feature="dashboard"
            label="Main Dashboard"
            isEnabled={isFeatureEnabled('dashboard')}
          />
        </div>
      </div>

      {/* Conditional Rendering Examples */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Conditional Content</h3>

        {renderForAdmin(
          <div className="p-3 bg-red-50 border border-red-200 rounded mb-2">
            <div className="text-red-800 font-medium">Admin-Only Content</div>
            <div className="text-red-600 text-sm">
              Ini hanya terlihat oleh admin. Anda dapat mengelola sistem secara penuh.
            </div>
          </div>,
        )}

        {renderForCreator(
          <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-2">
            <div className="text-blue-800 font-medium">Creator Content</div>
            <div className="text-blue-600 text-sm">
              Ini terlihat oleh admin dan creator. Anda dapat membuat dan mengedit konten.
            </div>
          </div>,
        )}

        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <div className="text-green-800 font-medium">Public Content</div>
          <div className="text-green-600 text-sm">
            Ini terlihat oleh semua user yang sudah login.
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function PermissionItem({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          allowed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {allowed ? 'Diizinkan' : 'Ditolak'}
      </span>
    </div>
  )
}

function FeatureFlag({
  feature,
  label,
  isEnabled,
}: {
  feature: string
  label: string
  isEnabled: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400 text-xs ml-2">({feature})</span>
      </div>
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          isEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {isEnabled ? 'Aktif' : 'Nonaktif'}
      </span>
    </div>
  )
}
