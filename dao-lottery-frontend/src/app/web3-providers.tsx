'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { config } from '../lib/wagmi'
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { ContractLoader } from '@/components/ContractLoader'
import { AccountModalProvider } from '@/contexts/AccountModalContext'
import { CustomWalletModal } from '@/components/wallet/CustomWalletModal'

// 创建一个稳定的 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1分钟
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

export function WebProviders({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null)
  const [mounted, setMounted] = useState(false)

  // 确保只在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果还没有挂载，返回一个简单的加载状态
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-red-500 text-xl font-bold">连接错误</div>
        <p className="text-gray-300 mt-2 text-center max-w-md px-4">
          {error.message || '无法连接到区块链网络。请确保本地节点正在运行，或者检查网络连接。'}
        </p>
        <button 
          className="mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors"
          onClick={() => window.location.reload()}
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#8B5CF6',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          <AccountModalProvider>
          <Toaster position="top-right" theme="dark" richColors closeButton />
          <ContractLoader>
            {children}
          </ContractLoader>
            <CustomWalletModal />
          </AccountModalProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 