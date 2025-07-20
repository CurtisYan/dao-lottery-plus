'use client'

import { useAccount, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'

// 获取用户GOV余额的hook
export function useGovBalance(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount()
  const targetAddress = address || connectedAddress
  
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.GovToken,
    abi: [
      {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress
    }
  })

  return {
    balance: data || BigInt(0),
    isLoading,
    isError,
    refetch
  }
} 