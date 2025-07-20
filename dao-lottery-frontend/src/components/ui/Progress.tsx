import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  animated?: boolean
  showLabel?: boolean
  label?: string
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  variant = 'primary',
  size = 'md',
  glow = false,
  animated = false,
  showLabel = false,
  label
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const variantClasses = {
    primary: 'from-primary to-purple-400',
    secondary: 'from-secondary to-blue-400', 
    accent: 'from-accent to-pink-400',
    success: 'from-green-400 to-emerald-400',
    warning: 'from-yellow-400 to-orange-400',
    danger: 'from-red-400 to-rose-400'
  }

  const glowClasses = {
    primary: 'shadow-[0_0_20px_rgba(139,92,246,0.6)]',
    secondary: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]',
    accent: 'shadow-[0_0_20px_rgba(236,72,153,0.6)]',
    success: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]',
    warning: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]',
    danger: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]'
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300">{label}</span>
          <span className="text-white font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={cn(
        "relative w-full bg-surface/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/10",
        sizeClasses[size]
      )}>
        {/* 背景发光效果 */}
        {glow && (
          <div className={cn(
            "absolute inset-0 rounded-full blur-sm",
            glowClasses[variant]
          )} />
        )}
        
        {/* 进度条 */}
        <div
          className={cn(
            "h-full bg-gradient-to-r rounded-full transition-all duration-700 ease-out relative overflow-hidden",
            variantClasses[variant],
            glow && glowClasses[variant],
            animated && "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-scan-line"
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* 扫描线动画 */}
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan-line" />
          )}
          
          {/* 光泽效果 */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export { Progress }
export type { ProgressProps } 