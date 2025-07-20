import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: [
          "bg-primary/20 text-primary border-primary/30",
          "hover:bg-primary/30"
        ],
        secondary: [
          "bg-secondary/20 text-secondary border-secondary/30",
          "hover:bg-secondary/30"
        ],
        accent: [
          "bg-accent/20 text-accent border-accent/30",
          "hover:bg-accent/30"
        ],
        outline: [
          "text-gray-300 border-gray-600",
          "hover:bg-gray-800 hover:text-white"
        ],
        success: [
          "bg-green-500/20 text-green-400 border-green-500/30",
          "hover:bg-green-500/30"
        ],
        warning: [
          "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          "hover:bg-yellow-500/30"
        ],
        error: [
          "bg-red-500/20 text-red-400 border-red-500/30",
          "hover:bg-red-500/30"
        ],
        glow: [
          "bg-primary/20 text-primary border-primary/30",
          "shadow-[0_0_10px_rgba(139,92,246,0.3)]",
          "hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]",
          "animate-glow"
        ]
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = "Badge"

export { Badge, badgeVariants }
export type { BadgeProps } 