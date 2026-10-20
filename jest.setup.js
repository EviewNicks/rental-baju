// Import jest-dom untuk menambahkan custom matchers seperti toBeInTheDocument()
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@testing-library/jest-dom')

// Polyfill web globals in JSDOM test environment
if (typeof global.Request === 'undefined' && typeof globalThis.Request !== 'undefined') {
  global.Request = globalThis.Request
  global.Response = globalThis.Response
  global.Headers = globalThis.Headers
  global.FormData = globalThis.FormData
}

// Import React untuk mock components
// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require('react')

// Setup environment variables untuk testing
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_testing'
process.env.CLERK_SECRET_KEY = 'sk_test_testing'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = '/sign-in'
process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = '/sign-up'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next/server for unit testing in JSDOM
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn((body, init) => ({
        status: init?.status || 200,
        json: async () => body,
      })),
    },
  }
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
})

// Mock BroadcastChannel
global.BroadcastChannel = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  close: jest.fn(),
}))

// Mock atob dan btoa untuk JWT
global.atob = jest.fn()
global.btoa = jest.fn()

// Mock TextEncoder and TextDecoder for jsPDF
//eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
})

// Mock auth hooks dari features/auth
jest.mock('@/features/auth', () => ({
  useUserRole: jest.fn(() => ({
    role: 'user',
    isLoading: false,
    error: null,
    isAdmin: false,
    isCreator: false,
    isUser: true,
  })),
  useRoleGuard: jest.fn(() => ({
    canAccessAdmin: () => false,
    canAccessCreator: () => false,
    canAccessUser: () => true,
  })),
  useRoleLoadingState: jest.fn(() => ({
    shouldShowLoader: false,
    isLoading: false,
  })),
  useRoleConditional: jest.fn(() => ({
    showForAdmin: false,
    showForCreator: false,
    showForUser: true,
  })),
  useRoleErrorHandling: jest.fn(() => ({
    hasError: false,
    error: null,
    retry: jest.fn(),
  })),
  useRoleDevelopment: jest.fn(() => ({
    switchRole: jest.fn(),
    currentMockRole: null,
  })),
  UserRoleProvider: ({ children }) => children,
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(() => ({
    user: {
      id: 'user_test123',
      firstName: 'Test',
      lastName: 'User',
      primaryEmailAddress: {
        emailAddress: 'test@example.com',
      },
      createdAt: new Date('2023-01-01'),
    },
    isLoaded: true,
    isSignedIn: true,
  })),
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    signOut: jest.fn(),
  })),
  UserButton: () => <div data-testid="user-button">User Button</div>,
  SignIn: () => <div data-testid="sign-in">Sign In</div>,
  SignUp: () => <div data-testid="sign-up">Sign Up</div>,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === '__esModule') return true
        if (typeof prop === 'string') {
          const MockIcon = (props) =>
            React.createElement('span', {
              'data-testid': `${prop.toLowerCase()}-icon`,
              ...props,
            })
          MockIcon.displayName = prop
          return MockIcon
        }
        return undefined
      },
    }
  )
})

// Mock UI Components
jest.mock('@/components/ui/button', () => ({
  Button: jest.fn(({ children, ...props }) => React.createElement('button', props, children)),
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: jest.fn(({ children, ...props }) => React.createElement('span', props, children)),
}))

// Suppress console errors during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
