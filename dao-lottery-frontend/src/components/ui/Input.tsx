import React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

// 定义输入框变体
const inputVariants = cva(
  "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-all duration-300 placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: [
          "border-primary/20 bg-surface/30",
          "focus:border-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
          "hover:border-primary/50"
        ],
        neon: [
          "border-secondary/30 bg-black/20",
          "focus:border-secondary focus:ring-2 focus:ring-secondary/30 focus:ring-offset-2",
          "hover:border-secondary/50"
        ]
      },
      glow: {
        true: "animate-glow",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      glow: false
    }
  }
)

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>,
  VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, glow, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant, glow }),
          "h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

// Textarea组件
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, glow, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            className={cn(
              "flex min-h-[80px] w-full rounded-lg border bg-transparent px-3 py-2 text-sm transition-all duration-300 placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
              variant === "default" && [
                "border-primary/30 bg-surface/30 backdrop-blur-sm text-white",
                "focus:border-primary focus:shadow-[0_0_15px_rgba(139,92,246,0.3)]",
                "hover:border-primary/50"
              ],
              variant === "neon" && [
                "border-secondary/30 bg-black/20 backdrop-blur-sm text-white",
                "focus:border-secondary focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]",
                "hover:border-secondary/50"
              ],
              glow && "animate-glow",
              error && "border-red-500 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
              className
            )}
            ref={ref}
            {...props}
          />
          {glow && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 blur-lg opacity-30 animate-pulse pointer-events-none rounded-lg" />
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Input, Textarea, inputVariants }
export type { InputProps, TextareaProps } 