'use client'

import { useAccount, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts'

export function useNFTBalance(contractAddress: string) {
  const { address } = useAccount()

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ABIS.ERC721,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
      refetchInterval: 15000, // 每15秒刷新一次
    },
  })

  return {
    balance: balance ? Number(balance) : 0,
    isLoading,
    error,
    refetch,
  }
}

export function useParticipationNFTBalance() {
  return useNFTBalance(CONTRACT_ADDRESSES.ParticipationNFT)
}

export function useStatusNFTBalance() {
  return useNFTBalance(CONTRACT_ADDRESSES.StatusNFT)
}

// 获取用户所有NFT余额
export function useUserNFTs() {
  const participationNFT = useParticipationNFTBalance()
  const statusNFT = useStatusNFTBalance()

  const totalNFTs = participationNFT.balance + statusNFT.balance
  const isLoading = participationNFT.isLoading || statusNFT.isLoading

  return {
    totalNFTs,
    participationNFTs: participationNFT.balance,
    statusNFTs: statusNFT.balance,
    isLoading,
    refetch: () => {
      participationNFT.refetch()
      statusNFT.refetch()
    }
  }
} 