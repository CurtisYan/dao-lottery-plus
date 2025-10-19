'use client'

import { useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

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
    args: [BigInt(proposalId)],
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

export function useVote() {
  const { writeContractAsync, isPending } = useWriteContract()

  const vote = async (proposalId: number, support: boolean) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.Governance,
      abi: governanceAbi,
      functionName: 'voteProposal',
      args: [BigInt(proposalId), support],
    })
  }

  return { vote, isPending }
}

export function useCreateProposal() {
  const { writeContractAsync, isPending } = useWriteContract()

  const createProposal = async (description: string, duration: number = 86400) => {
    if (!description.trim()) {
      throw new Error('提案描述不能为空')
    }

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.Governance,
      abi: governanceAbi,
      functionName: 'createProposal',
      args: [description, BigInt(duration)],
    })
  }

  return { createProposal, isPending }
}

export function useRemovalVote(proposalId: number) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: governanceAbi,
    functionName: 'getRemovalVote',
    args: [BigInt(proposalId)],
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
      args: [BigInt(proposalId), reason, BigInt(duration)],
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
      args: [BigInt(proposalId), support],
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
      args: [BigInt(proposalId)],
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
        balance: 0n,
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
    args: [BigInt(proposalId), address ?? ZERO_ADDRESS],
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
