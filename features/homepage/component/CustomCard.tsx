// components/CustomCard.tsx
import { FC, ReactNode } from 'react'

interface CustomCardProps {
  title: string
  children: ReactNode
  onAction?: () => void
  actionLabel?: string
}

const CustomCard: FC<CustomCardProps> = ({ title, children, onAction, actionLabel = 'Action' }) => (
  <div className="container mx-auto px-4 py-8">
    <div
      className={`
        bg-card
        text-card-foreground
        p-6
        rounded-lg
        shadow-glass
        animate-slide-up
        transition-all
        duration-500
        transition-maguru
      `}
    >
      <h2 className="font-serif text-2xl mb-4 dark:text-white">{title}</h2>
      <div className="font-sans text-base mb-6">{children}</div>
      {onAction && (
        <button
          onClick={onAction}
          className="
            px-4 py-2
            bg-secondary-500
            text-white
            rounded-md
            hover:bg-secondary-600
            transition-colors
            duration-300
          "
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
)

export default CustomCard
