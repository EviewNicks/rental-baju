'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isClickable = onStepClick && (isCompleted || step.id <= currentStep + 1)

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                    'border-2 focus:outline-none focus:ring-2 focus:ring-yellow-400/50',
                    isCompleted && 'bg-green-500 border-green-500 text-white',
                    isCurrent && 'bg-yellow-400 border-yellow-400 text-gray-900',
                    !isCompleted && !isCurrent && 'bg-gray-100 border-gray-300 text-gray-500',
                    isClickable && 'hover:scale-105 cursor-pointer',
                    !isClickable && 'cursor-not-allowed',
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                </button>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-gray-900',
                      isCompleted && 'text-green-600',
                      !isCompleted && !isCurrent && 'text-gray-500',
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 mt-[-20px]">
                  <div
                    className={cn(
                      'h-0.5 transition-colors duration-200',
                      step.id < currentStep ? 'bg-green-500' : 'bg-gray-300',
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
