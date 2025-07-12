// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/features/(.*)$': '<rootDir>/features/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  // Konfigurasi untuk menentukan file mana yang dianggap sebagai test
  testMatch: [
    // Unit tests - file dengan .test.* tapi bukan .int.test.*
    '**/*.(test|spec).(js|jsx|ts|tsx)',
    // Integration tests - file dengan .int.test.*
    '**/*.int.(test|spec).(js|jsx|ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/__tests__/integration/__mocks__/',
    '<rootDir>/__tests__/playwright/__mocks__/',
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/__mocks__/**', // Mengecualikan mock dari coverage
    '!jest.config.js',
    '!next.config.js',
  ],
  reporters: [
    'default', // Reporter default Jest
    '<rootDir>/services/detailedJsonReporter.js',
  ],
  transformIgnorePatterns: ['/node_modules/', '^.+\\.module\\.(css|sass|scss)$'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
