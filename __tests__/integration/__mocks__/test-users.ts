/**
 * Test User Personas dan Scenarios
 *
 * File ini berisi definisi user personas dan test scenarios untuk
 * integration testing authentication dan authorization system.
 */

import { UserRole } from '@/features/auth/types'

// User personas untuk testing
export const testUsers = {
  admin: {
    id: 'admin_123',
    role: 'admin' as UserRole,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@maguru.com',
    token:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbl8xMjMiLCJpc3MiOiJjbGVyayIsImV4cCI6OTk5OTk5OTk5OSwicm9sZSI6ImFkbWluIn0.signature',
    permissions: ['manage_users', 'manage_content', 'manage_system', 'view_analytics'],
    canAccess: ['/dashboard', '/admin/dashboard', '/creator/dashboard'],
    cannotAccess: [],
  },
  creator: {
    id: 'creator_123',
    role: 'creator' as UserRole,
    firstName: 'Creator',
    lastName: 'User',
    email: 'creator@maguru.com',
    token:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjcmVhdG9yXzEyMyIsImlzcyI6ImNsZXJrIiwiZXhwIjo5OTk5OTk5OTk5LCJyb2xlIjoiY3JlYXRvciJ9.signature',
    permissions: ['create_content', 'manage_own_content', 'view_analytics'],
    canAccess: ['/dashboard', '/creator/dashboard'],
    cannotAccess: ['/admin/dashboard'],
  },
  user: {
    id: 'user_123',
    role: 'user' as UserRole,
    firstName: 'Regular',
    lastName: 'User',
    email: 'user@maguru.com',
    token:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImlzcyI6ImNsZXJrIiwiZXhwIjo5OTk5OTk5OTk5LCJyb2xlIjoidXNlciJ9.signature',
    permissions: ['view_content', 'manage_profile'],
    canAccess: ['/dashboard'],
    cannotAccess: ['/admin/dashboard', '/creator/dashboard'],
  },
  unauthenticated: {
    id: null,
    role: null,
    firstName: null,
    lastName: null,
    email: null,
    token: null,
    permissions: [],
    canAccess: ['/sign-in', '/sign-up', '/'],
    cannotAccess: ['/dashboard', '/admin/dashboard', '/creator/dashboard'],
  },
}

// Route protection scenarios
export const routeScenarios = [
  {
    route: '/admin/dashboard',
    requiredRole: ['admin'],
    allowedUsers: ['admin'],
    deniedUsers: ['creator', 'user', 'unauthenticated'],
    redirectTo: '/unauthorized',
    description: 'Admin dashboard should only be accessible by admin users',
  },
  {
    route: '/creator/dashboard',
    requiredRole: ['admin', 'creator'],
    allowedUsers: ['admin', 'creator'],
    deniedUsers: ['user', 'unauthenticated'],
    redirectTo: '/unauthorized',
    description: 'Creator dashboard should be accessible by admin and creator users',
  },
  {
    route: '/dashboard',
    requiredRole: ['admin', 'creator', 'user'],
    allowedUsers: ['admin', 'creator', 'user'],
    deniedUsers: ['unauthenticated'],
    redirectTo: '/sign-in',
    description: 'General dashboard should be accessible by all authenticated users',
  },
  {
    route: '/sign-in',
    requiredRole: [],
    allowedUsers: ['admin', 'creator', 'user', 'unauthenticated'],
    deniedUsers: [],
    redirectTo: null,
    description: 'Sign-in page should be accessible by everyone',
  },
]

// Permission test scenarios
export const permissionScenarios = [
  {
    permission: 'manage_users',
    allowedRoles: ['admin'],
    deniedRoles: ['creator', 'user'],
    description: 'Only admin can manage users',
  },
  {
    permission: 'create_content',
    allowedRoles: ['admin', 'creator'],
    deniedRoles: ['user'],
    description: 'Admin and creator can create content',
  },
  {
    permission: 'view_content',
    allowedRoles: ['admin', 'creator', 'user'],
    deniedRoles: [],
    description: 'All authenticated users can view content',
  },
  {
    permission: 'manage_system',
    allowedRoles: ['admin'],
    deniedRoles: ['creator', 'user'],
    description: 'Only admin can manage system settings',
  },
]

// Role transition scenarios for testing role changes
export const roleTransitionScenarios = [
  {
    from: 'user',
    to: 'creator',
    description: 'User promoted to creator',
    expectedChanges: {
      canAccessCreator: true,
      canCreateContent: true,
      newPermissions: ['create_content', 'manage_own_content'],
    },
  },
  {
    from: 'creator',
    to: 'admin',
    description: 'Creator promoted to admin',
    expectedChanges: {
      canAccessAdmin: true,
      canManageUsers: true,
      newPermissions: ['manage_users', 'manage_system'],
    },
  },
  {
    from: 'admin',
    to: 'user',
    description: 'Admin demoted to user',
    expectedChanges: {
      canAccessAdmin: false,
      canAccessCreator: false,
      lostPermissions: ['manage_users', 'manage_system', 'create_content'],
    },
  },
]

// Error scenarios for testing error handling
export const errorScenarios = [
  {
    type: 'network_error',
    description: 'Network error during role fetch',
    mockError: new Error('Network request failed'),
    expectedBehavior: 'Fallback to cached role or default role',
  },
  {
    type: 'invalid_token',
    description: 'Invalid JWT token',
    mockError: new Error('Invalid token format'),
    expectedBehavior: 'Clear role and redirect to sign-in',
  },
  {
    type: 'expired_token',
    description: 'Expired JWT token',
    mockError: new Error('Token has expired'),
    expectedBehavior: 'Refresh token or redirect to sign-in',
  },
  {
    type: 'session_storage_error',
    description: 'SessionStorage unavailable',
    mockError: new Error('SessionStorage quota exceeded'),
    expectedBehavior: 'Continue with memory-only cache',
  },
  {
    type: 'broadcast_channel_error',
    description: 'BroadcastChannel not supported',
    mockError: new Error('BroadcastChannel is not supported'),
    expectedBehavior: 'Continue without cross-tab sync',
  },
]

// Helper functions for test setup
export const getUserByRole = (role: UserRole | null) => {
  if (!role) return testUsers.unauthenticated
  return testUsers[role]
}

export const getScenariosByRoute = (route: string) => {
  return routeScenarios.find((scenario) => scenario.route === route)
}

export const getPermissionScenario = (permission: string) => {
  return permissionScenarios.find((scenario) => scenario.permission === permission)
}

export const createMockJWT = (role: UserRole | null, expired = false) => {
  const header = { typ: 'JWT', alg: 'HS256' }
  const payload = {
    sub: role ? `${role}_123` : 'unknown_123',
    iss: 'clerk',
    exp: expired ? Math.floor(Date.now() / 1000) - 3600 : 9999999999, // Expired 1 hour ago or far future
    role: role,
  }

  // Simple base64 encoding for testing (not cryptographically secure)
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))

  return `${encodedHeader}.${encodedPayload}.mock_signature`
}

// Test state scenarios for different application states
export const appStateScenarios = [
  {
    name: 'initial_loading',
    description: 'Application is loading, user not yet authenticated',
    state: {
      isLoaded: false,
      isSignedIn: false,
      role: null,
      isLoading: true,
    },
  },
  {
    name: 'authenticated_admin',
    description: 'Admin user is fully authenticated and role is loaded',
    state: {
      isLoaded: true,
      isSignedIn: true,
      role: 'admin' as UserRole,
      isLoading: false,
    },
  },
  {
    name: 'authenticated_creator',
    description: 'Creator user is fully authenticated and role is loaded',
    state: {
      isLoaded: true,
      isSignedIn: true,
      role: 'creator' as UserRole,
      isLoading: false,
    },
  },
  {
    name: 'authenticated_user',
    description: 'Regular user is fully authenticated and role is loaded',
    state: {
      isLoaded: true,
      isSignedIn: true,
      role: 'user' as UserRole,
      isLoading: false,
    },
  },
  {
    name: 'unauthenticated',
    description: 'User is not authenticated',
    state: {
      isLoaded: true,
      isSignedIn: false,
      role: null,
      isLoading: false,
    },
  },
  {
    name: 'role_loading',
    description: 'User is authenticated but role is still loading',
    state: {
      isLoaded: true,
      isSignedIn: true,
      role: null,
      isLoading: true,
    },
  },
  {
    name: 'error_state',
    description: 'Error occurred during authentication or role fetch',
    state: {
      isLoaded: true,
      isSignedIn: true,
      role: null,
      isLoading: false,
      error: 'Failed to fetch user role',
    },
  },
]
