import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  "relative overflow-hidden rounded-xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: [
          "bg-surface/50 backdrop-blur-sm",
          "border border-primary/20",
          "shadow-lg shadow-primary/5"
        ],
        glass: [
          "bg-glass backdrop-blur-md",
          "border border-white/10",
          "shadow-xl shadow-black/20"
        ],
        glow: [
          "bg-surface/30 backdrop-blur-sm",
          "border border-primary/30",
          "shadow-[0_0_20px_rgba(139,92,246,0.15)]"
        ],
        neon: [
          "bg-black/40 backdrop-blur-sm",
          "border-2 border-transparent",
          "bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20",
          "relative before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r before:from-primary before:via-secondary before:to-accent before:rounded-xl before:-z-10"
        ]
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10"
      },
      hover: {
        true: "hover:scale-[1.02] hover:shadow-2xl",
        false: ""
      },
      glow: {
        true: "animate-glow",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      hover: false,
      glow: false
    }
  }
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, glow, children, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ variant, size, hover, glow, className }))}
        ref={ref}
        {...props}
      >
        {/* 霓虹光晕效果 */}
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 blur-xl opacity-50 animate-pulse" />
        )}
        
        {/* 内容 */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* 悬浮时的额外光效 */}
        {hover && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>
    )
  }
)

Card.displayName = "Card"

// 子组件
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
}
export type { CardProps } 