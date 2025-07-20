'use client'

import { useAccount, useReadContract, useWriteContract, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'
import { sepolia } from '@/lib/wagmi'
import { useProposalCount } from '@/hooks/useGovernance'
import { useGovBalance } from '@/hooks/useGovBalance'

// 获取奖池信息
export function usePrizeInfo() {
  // 获取当前提案ID
  const { data: proposalCount } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: [
      {
        "inputs": [],
        "name": "getProposalCount",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getProposalCount',
  })
  
  // 获取最新提案的奖池金额
  const currentProposalId = proposalCount ? Number(proposalCount) : 0;
  
  console.log('当前提案ID:', currentProposalId);
  
  // 如果没有提案，使用默认值
  if (currentProposalId === 0) {
    const prizeInfo = {
      rewardAmount: BigInt(0),
      govAmount: BigInt(11),
      totalPrize: BigInt(11),
      participationCount: BigInt(0)
    };
    
    return {
      prizeInfo,
      isLoading: false,
      isError: false,
      refetch: () => {}
    };
  }
  
  // 获取最新提案的奖池金额
  const { data: poolAmount, isLoading: isPoolLoading, isError: isPoolError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Lottery,
    abi: [
      {
        "inputs": [{"name": "_proposalId", "type": "uint8"}],
        "name": "getPoolAmount",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getPoolAmount',
    args: [currentProposalId],
  })
  
  // 记录奖池金额
  console.log('奖池金额:', poolAmount?.toString(), '提案ID:', currentProposalId);
  
  // 从合约读取实际奖励值
  const prizeInfo = {
    rewardAmount: poolAmount || BigInt(0), // 从合约获取奖池金额
    govAmount: BigInt(11), // 根据合约claimReward方法中的值
    totalPrize: (poolAmount || BigInt(0)) + BigInt(11),
    participationCount: BigInt(1) // 参与NFT数量
  }

  return { 
    prizeInfo, 
    isLoading: isPoolLoading, 
    isError: isPoolError, 
    refetch // 返回真实的refetch函数
  }
}

// 获取参与者列表 - 修复为获取抽奖池参与者
export function useParticipants() {
  const { count: proposalCount } = useProposalCount()
  
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: [
      {
        "inputs": [{"name": "_proposalId", "type": "uint8"}],
        "name": "getEligibleForLottery",
        "outputs": [{"name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getEligibleForLottery',
    args: proposalCount ? [Number(proposalCount)] : undefined,
    query: {
      enabled: !!proposalCount
    }
  })
  
  // 返回真实的链上数据
  return { 
    participants: data || [], 
    participantCount: data?.length || 0,
    isLoading, 
    isError,
    refetch
  }
}

// 检查是否已参与抽奖 - 修复为检查用户是否在抽奖池中
export function useIsParticipant() {
  const { address } = useAccount()
  const { count: proposalCount } = useProposalCount()
  
  // 获取最新提案的抽奖池参与者
  const { data: eligibleVoters, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: [
      {
        "inputs": [{"name": "_proposalId", "type": "uint8"}],
        "name": "getEligibleForLottery",
        "outputs": [{"name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getEligibleForLottery',
    args: proposalCount ? [Number(proposalCount)] : undefined,
    query: {
      enabled: !!address && !!proposalCount
    }
  })

  // 检查当前用户是否在抽奖池中
  const isParticipant = address && eligibleVoters ? 
    eligibleVoters.includes(address as `0x${string}`) : false

  return { 
    isParticipant, 
    isLoading, 
    isError,
    refetch
  }
}

// 检查用户是否有资格参与抽奖（持有足够的GOV代币）
export function useLotteryEligibility() {
  const { address } = useAccount()
  const { balance: govBalance, isLoading: balanceLoading } = useGovBalance(address)
  
  // 从合约获取实际的THRESHOLD值
  const { data: threshold, isLoading: thresholdLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: [
      {
        "inputs": [],
        "name": "THRESHOLD",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'THRESHOLD',
  })
  
  const requiredAmount = threshold || BigInt(10) // 默认值
  const isEligible = govBalance >= requiredAmount
  const isLoading = balanceLoading || thresholdLoading
  
  return {
    isEligible,
    govBalance,
    isLoading,
    requiredAmount
  }
}

// 移除不存在的joinLottery函数
// export function useJoinLottery() {
//   // 这个函数不应该存在，因为抽奖参与是通过投票实现的
// } 
