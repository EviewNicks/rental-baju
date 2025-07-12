import type React from 'react'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'
import { UserRoleProvider } from '../features/auth'
import '../styles/globals.css'

// Load Google Fonts via next/font/google
import { Poppins, Playfair_Display, Fira_Code } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Maguru - Platform Course Online Terdepan',
  description:
    'Belajar skill digital terbaru dengan mentor expert di Maguru. Ribuan course berkualitas tinggi untuk mengembangkan karir Anda.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${playfair.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <UserRoleProvider
              devMode={{
                enabled: process.env.NODE_ENV === 'development',
                allowRoleSwitching: process.env.NODE_ENV === 'development',
              }}
              cacheConfig={{
                ttl: parseInt(process.env.NEXT_PUBLIC_ROLE_CACHE_TTL || '300000'),
                enableSessionStorage: process.env.NEXT_PUBLIC_ENABLE_ROLE_CACHE !== 'false',
              }}
            >
              {children}
            </UserRoleProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
