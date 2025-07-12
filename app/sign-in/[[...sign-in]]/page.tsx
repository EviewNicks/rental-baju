'use client'

import React from 'react'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent-mint/5 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-mint/5 rounded-full blur-3xl"></div>
      </div>

      {/* Auth container */}
      <div className="glass-panel p-8 rounded-lg shadow-glass w-full max-w-md relative z-10 backdrop-blur-sm">
        <SignIn
          appearance={{
            elements: {
              card: 'bg-transparent shadow-none border-none',
              formButtonPrimary:
                'neu-button bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity',
              headerTitle: 'text-2xl font-bold text-primary',
              headerSubtitle: 'text-muted-foreground',
              formFieldLabel: 'text-gray-700 font-medium',
              formFieldInput:
                'rounded-md border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary',
              footerActionText: 'text-gray-600',
              footerActionLink: 'text-primary hover:text-primary/80',
              dividerLine: 'bg-gray-200',
              dividerText: 'text-gray-500',
              socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50 transition-colors',
              socialButtonsBlockButtonText: 'text-gray-600 font-medium',
              formFieldError: 'text-red-500 text-sm',
              footer: 'hidden',
            },
            variables: {
              colorPrimary: '#8C4FFF',
              colorTextOnPrimaryBackground: 'white',
              borderRadius: '0.5rem',
            },
          }}
          fallbackRedirectUrl="/dashboard"
          signUpUrl="/sign-up"
          routing="path"
          path="/sign-in"
        />
      </div>
    </main>
  )
}
