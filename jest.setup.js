// Import jest-dom untuk menambahkan custom matchers seperti toBeInTheDocument()
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@testing-library/jest-dom')

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
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Users: () => <div data-testid="users-icon">Users Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
  BarChart3: () => <div data-testid="barchart-icon">BarChart Icon</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp Icon</div>,
  DollarSign: () => <div data-testid="dollar-sign-icon">DollarSign Icon</div>,
  Activity: () => <div data-testid="activity-icon">Activity Icon</div>,
  Clock: () => <div data-testid="clock-icon">Clock Icon</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar Icon</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle Icon</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle Icon</div>,
  RefreshCw: () => <div data-testid="refresh-icon">Refresh Icon</div>,
  ArrowRight: () => <div data-testid="arrow-right-icon">ArrowRight Icon</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles Icon</div>,
  Star: () => <div data-testid="star-icon">Star Icon</div>,
  Play: () => <div data-testid="play-icon">Play Icon</div>,
  Zap: () => <div data-testid="zap-icon">Zap Icon</div>,
  Shield: () => <div data-testid="shield-icon">Shield Icon</div>,
  Headphones: () => <div data-testid="headphones-icon">Headphones Icon</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy Icon</div>,
  BookOpen: () => <div data-testid="bookopen-icon">BookOpen Icon</div>,
  Mail: () => <div data-testid="mail-icon">Mail Icon</div>,
  Phone: () => <div data-testid="phone-icon">Phone Icon</div>,
  MapPin: () => <div data-testid="map-pin-icon">MapPin Icon</div>,
  Clock: () => <div data-testid="clock-icon">Clock Icon</div>,
  Users: () => <div data-testid="users-icon">Users Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
  Menu: () => <div data-testid="menu-icon">Menu Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp Icon</div>,
  Award: () => <div data-testid="award-icon">Award Icon</div>,
  Quote: () => <div data-testid="quote-icon">Quote Icon</div>,
  PenTool: () => <div data-testid="pen-tool-icon">PenTool Icon</div>,
  Video: () => <div data-testid="video-icon">Video Icon</div>,
  FileText: () => <div data-testid="file-text-icon">FileText Icon</div>,
}))

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
