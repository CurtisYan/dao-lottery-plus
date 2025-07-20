'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { CONTRACT_ADDRESSES, updateContractAddresses } from '@/lib/contracts'
import { useDeploymentListener, getRecentDeployments } from '@/lib/deployListener'
import { toast } from 'sonner'

// 调试信息类型
interface DebugInfo {
  validationResults?: Record<string, any>;
  recentDeployments?: string;
  loadError?: string;
  validCount?: number;
  totalCount?: number;
  currentAddresses?: Record<string, string>;
  [key: string]: any;
}

export function ContractLoader({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [mounted, setMounted] = useState(false)
  const [healthStatus, setHealthStatus] = useState<'loading' | 'healthy' | 'warning' | 'error'>('loading')
  const publicClient = usePublicClient({ chainId: sepolia.id })
  
  // 确保只在客户端运行
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 监听新的合约部署（只在客户端）
  useDeploymentListener()

  // 检查是否已经显示过操作提示
  const hasShownReadyMessage = () => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('contract_ready_shown') === 'true'
  }

  // 标记已经显示过操作提示
  const markReadyMessageShown = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem('contract_ready_shown', 'true')
  }

  // 检查合约地址是否有效
  const validateContractAddresses = async () => {
    if (!publicClient) return false
    
    try {
      let allValid = true
      let validCount = 0;
      let totalCount = 0;
      const results: Record<string, any> = {}
      
      // 保存当前使用的合约地址
      const currentAddresses: Record<string, string> = {};
      
      // 检查每个合约地址是否有代码
      for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
        // 保存当前使用的地址
        currentAddresses[name] = address as string;
        
        totalCount++;
        if (!address || address === '0x0000000000000000000000000000000000000000') {
          results[name] = { valid: false, reason: '地址为空或零地址' }
          allValid = false;
          continue;
        }
        
        try {
          const code = await publicClient.getBytecode({ address })
          if (!code || code === '0x') {
            results[name] = { valid: false, reason: '地址没有部署合约代码' }
            allValid = false;
          } else {
            results[name] = { valid: true, codeLength: code.length }
            validCount++;
          }
        } catch (error) {
          results[name] = { valid: false, reason: '验证失败', error: String(error) }
          allValid = false;
        }
      }
      
      // 根据验证结果设置健康状态
      if (allValid && validCount === totalCount) {
        setHealthStatus('healthy');
      } else if (validCount > 0) {
        setHealthStatus('warning');
      } else {
        setHealthStatus('error');
      }
      
      setDebugInfo({ validationResults: results, validCount, totalCount, currentAddresses });
      return allValid;
    } catch (error) {
      console.error('验证合约地址失败:', error)
      setHealthStatus('error');
      return false;
    }
  }

  useEffect(() => {
    const loadContracts = async () => {
      // 只在客户端挂载后执行
      if (!mounted) return
      
      try {
        if (!publicClient) {
          console.warn('公共客户端未初始化，使用默认合约地址')
          setIsLoading(false)
          return
        }

        // 检查当前合约地址是否有效
        const addressesValid = await validateContractAddresses()
        
        // 如果当前地址无效，尝试从区块链获取最近部署的合约地址
        if (!addressesValid) {
          console.log('当前合约地址无效，尝试获取最近部署的合约地址')
          const recentDeployments = await getRecentDeployments(publicClient)
          
          // 如果找到了合约地址，就更新它们
          if (Object.keys(recentDeployments).length > 0) {
            console.log('找到最近部署的合约:', recentDeployments)
            
            // 显示找到的合约地址
            const foundContracts = Object.keys(recentDeployments).join(', ')
            // 只在第一次加载时显示提示
            if (!hasShownReadyMessage()) {
              toast.success(`找到合约: ${foundContracts}，合约已加载，可进行交互`)
              markReadyMessageShown()
            }
            
            updateContractAddresses(recentDeployments)
            return // updateContractAddresses会刷新页面
          } else {
            console.warn('未找到最近部署的合约地址，使用默认地址')
            setDebugInfo(prev => ({ ...prev, recentDeployments: 'None found' }))
          }
        } else {
          console.log('当前合约地址有效')
          // 只在第一次加载时显示提示
          if (!hasShownReadyMessage()) {
            toast.success('您现在可以进行操作')
            markReadyMessageShown()
          }
        }
        
        setIsLoading(false)
      } catch (err) {
        console.error('加载合约地址失败:', err)
        setError('无法加载合约地址，使用默认地址')
        setDebugInfo(prev => ({ ...prev, loadError: String(err) }))
        setIsLoading(false)
      }
    }

    if (publicClient && mounted) {
      loadContracts()
    } else if (mounted) {
      setIsLoading(false)
    }
  }, [publicClient, mounted])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-lg font-medium">加载合约信息...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="bg-surface p-6 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center mb-2">
            <div className={`w-4 h-4 rounded-full mr-2 ${
              healthStatus === 'healthy' ? 'bg-green-500' :
              healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <h3 className="text-xl font-bold text-red-500">合约加载错误</h3>
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <p className="text-gray-400 mb-4">应用将使用默认合约地址继续。如果遇到问题，请刷新页面或联系管理员。</p>
          
          {/* 显示健康状态 */}
          <div className="mb-4 p-3 border border-gray-700 rounded-md">
            <h4 className="font-medium mb-2">合约健康状态</h4>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                healthStatus === 'healthy' ? 'bg-green-500' :
                healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span>
                {healthStatus === 'healthy' ? '所有合约正常' :
                 healthStatus === 'warning' ? '部分合约可用' : '合约不可用'}
                {debugInfo && ` (${debugInfo.validCount || 0}/${debugInfo.totalCount || 0})`}
              </span>
            </div>
          </div>
          
          {/* 显示调试信息 */}
          {debugInfo && (
            <details className="mb-4 text-xs text-gray-500 border border-gray-700 p-2 rounded">
              <summary>调试信息</summary>
              <pre className="overflow-auto max-h-40 p-2">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              刷新页面
            </button>
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-surface border border-gray-700 text-gray-300 rounded-md hover:bg-surface/80 transition-colors"
            >
              继续
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 