'use client'

import { useMemo, useState } from 'react'
import { useAccount, useConfig, useReadContract, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const govTokenAbi = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export const GOV_VOTE_COST = BigInt(1)
export const GOV_PROPOSAL_FEE = BigInt(10)

const governanceAbi = [
  {
    inputs: [],
    name: 'getProposalCount',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_proposalId', type: 'uint8' }],
    name: 'getProposal',
    outputs: [
      { type: 'string' },
      { type: 'address' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'bool' },
      { type: 'bool' },
      { type: 'uint256' },
      { type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_proposalId', type: 'uint8' }],
    name: 'getRemovalVote',
    outputs: [
      { type: 'bool' },
      { type: 'string' },
      { type: 'address' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getRemovalEligibility',
    outputs: [
      { type: 'bool' },
      { type: 'bool' },
      { type: 'bool' },
      { type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_proposalId', type: 'uint8' }, { name: '_choice', type: 'bool' }],
    name: 'voteProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_desc', type: 'string' }, { name: '_duration', type: 'uint256' }],
    name: 'createProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_proposalId', type: 'uint8' }, { name: '_reason', type: 'string' }, { name: '_duration', type: 'uint256' }],
    name: 'initiateRemovalVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_proposalId', type: 'uint8' }, { name: '_support', type: 'bool' }],
    name: 'voteOnRemoval',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_proposalId', type: 'uint8' }],
    name: 'finalizeRemovalVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_proposalId', type: 'uint8' }, { name: '_user', type: 'address' }],
    name: 'hasRemovalVoted',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

type ProposalTuple = [
  string,
  `0x${string}`,
  bigint,
  bigint,
  boolean,
  boolean,
  bigint,
  boolean,
]

type RemovalVoteTuple = [
  boolean,
  string,
  `0x${string}`,
  bigint,
  bigint,
  bigint,
  boolean,
]

type EligibilityTuple = [boolean, boolean, boolean, bigint]

export function useProposalCount() {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: governanceAbi,
    functionName: 'getProposalCount',
  })

  return {
    count: data ? Number(data) : 0,
    isLoading,
    isError,
    refetch,
  }
}

export function useProposal(proposalId: number) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: governanceAbi,
    functionName: 'getProposal',
    args: [proposalId],
    query: {
      enabled: proposalId > 0,
    },
  })

  const proposal = useMemo(() => {
    if (!data) return null
    const [description, proposer, yesVotes, noVotes, pass, finalized, deadline, removed] = data as ProposalTuple
    const forVotes = Number(yesVotes)
    const againstVotes = Number(noVotes)
    const totalVotes = forVotes + againstVotes
    const endTime = Number(deadline) * 1000

    let status: 'active' | 'passed' | 'rejected' | 'awaiting-finalization' | 'removed'
    if (removed) {
      status = 'removed'
    } else if (!finalized && Date.now() < endTime) {
      status = 'active'
    } else if (!finalized) {
      status = 'awaiting-finalization'
    } else {
      status = pass ? 'passed' : 'rejected'
    }

    return {
      id: proposalId,
      description,
      proposer,
      forVotes,
      againstVotes,
      totalVotes,
      pass,
      finalized,
      deadline: Number(deadline),
      endTime,
      removed,
      status,
    }
  }, [data, proposalId])

  return {
    proposal,
    isLoading,
    isError,
    refetch,
  }
}

export function useGovTokenAllowance(spender: `0x${string}` = CONTRACT_ADDRESSES.Governance) {
  const { address } = useAccount()

  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.GovToken,
    abi: govTokenAbi,
    functionName: 'allowance',
    args: [address ?? ZERO_ADDRESS, spender],
    query: {
      enabled: !!address,
    },
  })

  return {
    allowance: (data as bigint | undefined) ?? BigInt(0),
    isLoading,
    isError,
    refetch,
  }
}

export function useVote() {
  const { address } = useAccount()
  const config = useConfig()
  const { allowance, refetch: refetchAllowance } = useGovTokenAllowance()
  const { writeContractAsync: writeGovernance } = useWriteContract()
  const { writeContractAsync: writeGovToken } = useWriteContract()
  const [isApproving, setIsApproving] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const vote = async (proposalId: number, support: boolean) => {
    if (!address) {
      throw Object.assign(new Error('请先连接钱包'), { stage: 'wallet' as const })
    }

    let approvalHash: `0x${string}` | null = null

    if (allowance < GOV_VOTE_COST) {
      try {
        setIsApproving(true)
        approvalHash = await writeGovToken({
          address: CONTRACT_ADDRESSES.GovToken,
          abi: govTokenAbi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.Governance, GOV_VOTE_COST],
        })
        await waitForTransactionReceipt(config, { hash: approvalHash })
        await refetchAllowance()
      } catch (error) {
        const err = error instanceof Error ? error : new Error('授权失败')
        ;(err as { stage?: string }).stage = 'approval'
        throw err
      } finally {
        setIsApproving(false)
      }
    }

    try {
      setIsVoting(true)
      const voteHash = await writeGovernance({
        address: CONTRACT_ADDRESSES.Governance,
        abi: governanceAbi,
        functionName: 'voteProposal',
        args: [proposalId, support],
      })
      await waitForTransactionReceipt(config, { hash: voteHash })
      await refetchAllowance()
      return { voteHash, approvalHash }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('投票失败')
      ;(err as { stage?: string }).stage = 'vote'
      throw err
    } finally {
      setIsVoting(false)
    }
  }

  return {
    vote,
    isPending: isVoting,
    isApproving,
    allowance,
  }
}

export function useCreateProposal() {
  const { address } = useAccount()
  const config = useConfig()
  const { allowance, refetch: refetchAllowance } = useGovTokenAllowance()
  const { writeContractAsync: writeGovernance } = useWriteContract()
  const { writeContractAsync: writeGovToken } = useWriteContract()
  const [isApproving, setIsApproving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const createProposal = async (description: string, duration: number = 86400) => {
    if (!description.trim()) {
      throw new Error('提案描述不能为空')
    }
    if (!address) {
      throw Object.assign(new Error('请先连接钱包'), { stage: 'wallet' as const })
    }

    let approvalHash: `0x${string}` | null = null

    if (allowance < GOV_PROPOSAL_FEE) {
      try {
        setIsApproving(true)
        approvalHash = await writeGovToken({
          address: CONTRACT_ADDRESSES.GovToken,
          abi: govTokenAbi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.Governance, GOV_PROPOSAL_FEE],
        })
        await waitForTransactionReceipt(config, { hash: approvalHash })
        await refetchAllowance()
      } catch (error) {
        const err = error instanceof Error ? error : new Error('授权失败')
        ;(err as { stage?: string }).stage = 'approval'
        throw err
      } finally {
        setIsApproving(false)
      }
    }

    try {
      setIsCreating(true)
      const proposalHash = await writeGovernance({
        address: CONTRACT_ADDRESSES.Governance,
        abi: governanceAbi,
        functionName: 'createProposal',
        args: [description, BigInt(duration)],
      })
      await waitForTransactionReceipt(config, { hash: proposalHash })
      await refetchAllowance()
      return { proposalHash, approvalHash }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('创建提案失败')
      ;(err as { stage?: string }).stage = 'proposal'
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  return {
    createProposal,
    isPending: isCreating,
    isApproving,
    allowance,
  }
}

export function useRemovalVote(proposalId: number) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: governanceAbi,
    functionName: 'getRemovalVote',
    args: [proposalId],
    query: {
      enabled: proposalId > 0,
    },
  })

  const removal = useMemo(() => {
    if (!data) return null
    const tuple = data as RemovalVoteTuple
    if (!tuple[0]) return null

    const [, reason, initiator, deadline, yesVotes, noVotes, executed] = tuple

    return {
      reason,
      initiator,
      deadline: Number(deadline),
      endTime: Number(deadline) * 1000,
      yesVotes: Number(yesVotes),
      noVotes: Number(noVotes),
      executed,
    }
  }, [data])

  return {
    removal,
    isLoading,
    isError,
    refetch,
  }
}

export function useInitiateRemovalVote() {
  const { writeContractAsync, isPending } = useWriteContract()

  const initiateRemovalVote = async (proposalId: number, reason: string, duration: number) => {
    if (!reason.trim()) {
      throw new Error('请填写删除提案的理由')
    }
    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.Governance,
      abi: governanceAbi,
      functionName: 'initiateRemovalVote',
      args: [proposalId, reason, BigInt(duration)],
    })
  }

  return { initiateRemovalVote, isPending }
}

export function useVoteOnRemoval() {
  const { writeContractAsync, isPending } = useWriteContract()

  const voteRemoval = async (proposalId: number, support: boolean) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.Governance,
      abi: governanceAbi,
      functionName: 'voteOnRemoval',
      args: [proposalId, support],
    })
  }

  return { voteRemoval, isPending }
}

export function useFinalizeRemovalVote() {
  const { writeContractAsync, isPending } = useWriteContract()

  const finalizeRemovalVote = async (proposalId: number) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.Governance,
      abi: governanceAbi,
      functionName: 'finalizeRemovalVote',
      args: [proposalId],
    })
  }

  return { finalizeRemovalVote, isPending }
}

export function useRemovalEligibility() {
  const { address } = useAccount()
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: governanceAbi,
    functionName: 'getRemovalEligibility',
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled: !!address,
    },
  })

  const eligibility = useMemo(() => {
    if (!data) {
      return {
        eligible: false,
        qualifiesHighTier: false,
        qualifiesLowTier: false,
        balance: BigInt(0),
      }
    }

    const [eligible, qualifiesHighTier, qualifiesLowTier, balance] = data as EligibilityTuple
    return { eligible, qualifiesHighTier, qualifiesLowTier, balance }
  }, [data])

  return { eligibility, isLoading, isError, refetch }
}

export function useHasRemovalVoted(proposalId: number) {
  const { address } = useAccount()
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: governanceAbi,
    functionName: 'hasRemovalVoted',
    args: [proposalId, address ?? ZERO_ADDRESS],
    query: {
      enabled: !!address && proposalId > 0,
    },
  })

  return {
    hasVoted: Boolean(data),
    isLoading,
    isError,
    refetch,
  }
}
