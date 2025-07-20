import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-primary to-secondary text-white",
          "border border-primary/30",
          "hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]",
          "hover:scale-105",
          "active:scale-95"
        ],
        secondary: [
          "bg-surface/50 backdrop-blur-sm text-secondary border border-secondary/30",
          "hover:bg-secondary/10",
          "hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]",
          "hover:border-secondary/50"
        ],
        ghost: [
          "text-primary hover:text-primary/80",
          "hover:bg-primary/5",
          "border border-transparent",
          "hover:border-primary/20"
        ],
        danger: [
          "bg-gradient-to-r from-red-500 to-accent text-white",
          "border border-red-500/30",
          "hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]",
          "hover:scale-105"
        ]
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg"
      },
      glow: {
        true: "animate-glow",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      glow: false
    }
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glow, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...props}
      >
        {/* 霓虹光晕背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg blur-sm" />
        
        {/* 按钮内容 */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
        
        {/* 点击波纹效果 */}
        <div className="absolute inset-0 opacity-0 group-active:opacity-20 bg-white transition-opacity duration-150 rounded-lg" />
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps } 