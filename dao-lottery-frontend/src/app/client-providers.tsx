'use client'

import dynamic from 'next/dynamic'
import { ReactNode, Component, ErrorInfo, useState, useEffect } from 'react'
import { LoadingState } from '@/components/ui/LoadingState'

// 错误边界组件
class ErrorBoundary extends Component<
  { children: ReactNode, fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode, fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Web3 provider error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

// 错误回退UI
const ErrorFallback = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
    <div className="w-16 h-16 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <div className="text-red-500 text-xl font-bold">Web3加载错误</div>
    <p className="text-gray-300 mt-2 text-center max-w-md px-4">
      加载Web3组件时发生错误。这可能是由于浏览器兼容性问题或网络连接问题导致的。
    </p>
    <button 
      className="mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors"
      onClick={() => window.location.reload()}
    >
      刷新页面
    </button>
  </div>
)

// 不使用动态导入，避免SSR问题
const NoSSR = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <LoadingState />
  }
  
  return <>{children}</>
}

// 客户端提供者组件
export function ClientProviders({ children }: { children: ReactNode }) {
  // 直接导入WebProviders组件，避免动态导入
  const WebProviders = require('./web3-providers').WebProviders
  
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <NoSSR>
        <WebProviders>
          {children}
        </WebProviders>
      </NoSSR>
    </ErrorBoundary>
  )
}
