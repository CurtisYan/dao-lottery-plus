'use client'

import { useAccount, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES, ERC20_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'

export function useTokenBalance(tokenAddress: string, decimals: number = 18) {
  const { address } = useAccount()

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI, // 使用正确的对象格式 ABI
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000, // 减少到5秒，提高响应速度
      retry: 3, // 添加重试机制
      retryDelay: 1000, // 重试间隔1秒
    },
  })

  // 添加调试信息
  if (error) {
    console.error('Token balance error:', error)
  }

  const formattedBalance = balance ? formatUnits(balance as bigint, decimals) : '0'

  return {
    balance: formattedBalance,
    rawBalance: balance as bigint,
    isLoading,
    error,
    refetch,
  }
}

// 预定义的代币hooks
export function useGovTokenBalance() {
  return useTokenBalance(CONTRACT_ADDRESSES.GovToken)
}

export function useRewardTokenBalance() {
  const result = useTokenBalance(CONTRACT_ADDRESSES.RewardToken)
  
  // 添加调试信息
  if (result.isLoading) {
    console.log('RWD token loading, address:', CONTRACT_ADDRESSES.RewardToken)
  }
  if (result.error) {
    console.error('RWD token error:', result.error)
  }
  
  return result
} 