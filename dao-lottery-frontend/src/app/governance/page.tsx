'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
  Vote,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Coins,
  TrendingUp,
  User,
  Filter,
  Loader2,
  ShieldAlert,
  Hammer,
} from 'lucide-react'
import { useAccount } from 'wagmi'
import {
  useProposalCount,
  useProposal,
  useVote,
  useCreateProposal,
  useRemovalVote,
  useInitiateRemovalVote,
  useVoteOnRemoval,
  useFinalizeRemovalVote,
  useRemovalEligibility,
  useHasRemovalVoted,
  GOV_VOTE_COST,
  GOV_PROPOSAL_FEE,
} from '@/hooks/useGovernance'
import { useGovTokenBalance } from '@/hooks/useTokenBalance'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog'
import { formatUnits } from 'viem'

// 统计数据 - 这部分后续会改为真实数据
const stats = [
  { label: '活跃提案', value: '0', icon: Vote, color: 'primary' },
  { label: '总投票数', value: '0', icon: Users, color: 'secondary' },
  { label: '治理代币', value: '0', icon: Coins, color: 'accent' },
  { label: '参与率', value: '0%', icon: TrendingUp, color: 'success' }
]

const ProposalCard = ({
  proposalId,
  removalEligibility,
}: {
  proposalId: number
  removalEligibility: {
    eligible: boolean
    qualifiesHighTier: boolean
    qualifiesLowTier: boolean
    balance: bigint
  }
}) => {
  const { proposal, isLoading, isError, refetch } = useProposal(proposalId)
  const { removal, refetch: refetchRemoval } = useRemovalVote(proposalId)
  const { vote, isPending, isApproving } = useVote()
  const { initiateRemovalVote, isPending: isInitiatingRemoval } = useInitiateRemovalVote()
  const { voteRemoval, isPending: isVotingRemoval } = useVoteOnRemoval()
  const { finalizeRemovalVote, isPending: isFinalizingRemoval } = useFinalizeRemovalVote()
  const { hasVoted: hasRemovalVoted, refetch: refetchRemovalVoteStatus } = useHasRemovalVoted(proposalId)
  const { address } = useAccount()

  const [votingFor, setVotingFor] = useState(false)
  const [votingAgainst, setVotingAgainst] = useState(false)
  const [isRemovalDialogOpen, setRemovalDialogOpen] = useState(false)
  const [removalReason, setRemovalReason] = useState('')
  const [removalDurationHours, setRemovalDurationHours] = useState(24)
  const [removalVotingFor, setRemovalVotingFor] = useState(false)
  const [removalVotingAgainst, setRemovalVotingAgainst] = useState(false)

  if (isLoading) {
    return (
      <Card variant="glass" hover className="group">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">加载中...</span>
        </CardContent>
      </Card>
    )
  }

  if (isError || !proposal) {
    return (
      <Card variant="glass" hover className="group">
        <CardContent className="py-16 text-center">
          <p className="text-red-400">加载提案失败</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2">
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'warning'
      case 'passed':
        return 'success'
      case 'rejected':
        return 'error'
      case 'awaiting-finalization':
        return 'secondary'
      case 'removed':
        return 'error'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '投票中'
      case 'passed':
        return '已通过'
      case 'rejected':
        return '未通过'
      case 'awaiting-finalization':
        return '待结算'
      case 'removed':
        return '已删除'
      default:
        return '未知'
    }
  }

  const votePercentage = proposal.totalVotes > 0 ? (proposal.forVotes / proposal.totalVotes) * 100 : 0
  const isActive = proposal.status === 'active'
  const isRemoved = proposal.removed
  const timeLeft = isActive ? proposal.endTime - Date.now() : 0
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)))

  const removalActive = removal ? !removal.executed && Date.now() < removal.endTime : false
  const removalEnded = removal ? !removal.executed && Date.now() >= removal.endTime : false
  const removalExecuted = removal ? removal.executed : false
  const canVoteOnRemoval = removalActive && removalEligibility.eligible && !hasRemovalVoted
  const canFinalizeRemoval = removalEnded
  const canInitiateRemoval = removalEligibility.eligible && !removal && !isRemoved

  const removalRequirementHint = (() => {
    if (!address) {
      return '连接钱包以检查删除投票资格'
    }
    if (removalEligibility.eligible) {
      if (removalEligibility.qualifiesHighTier) {
        return '已持有高等级身份 NFT（钻石/王者），仅需 ≥200 GOV 即可参与'
      }
      if (removalEligibility.qualifiesLowTier) {
        return '已持有基础身份 NFT（白银/黄金），需要 ≥500 GOV 即可参与'
      }
      return '满足删除投票资格'
    }
    if (removalEligibility.qualifiesHighTier || removalEligibility.qualifiesLowTier) {
      return '需要更多 GOV 余额才能参与删除投票'
    }
    return '需要先领取身份 NFT 才能参与删除投票'
  })()

  const handleVote = async (support: boolean) => {
    if (!address) {
      toast.error('请先连接钱包')
      return
    }
    if (isRemoved) {
      toast.error('该提案已被删除')
      return
    }

    try {
      if (support) {
        setVotingFor(true)
      } else {
        setVotingAgainst(true)
      }

      const result = await vote(proposal.id, support)

      if (result?.approvalHash) {
        toast.success(`授权成功，额度 ${formatUnits(GOV_VOTE_COST, 18)} GOV`)
      }

      toast.success(`投票${support ? '支持' : '反对'}成功`)
      refetch()
    } catch (error) {
      console.error('投票失败:', error)
      const stage = (error as { stage?: string }).stage
      const message = (error as Error).message || '操作失败'

      if (stage === 'approval') {
        toast.error(`授权失败：${message}`)
      } else if (stage === 'vote') {
        toast.error(`投票失败：${message}`)
      } else if (stage === 'wallet') {
        toast.error(message)
      } else {
        toast.error(`操作失败：${message}`)
      }
    } finally {
      setVotingFor(false)
      setVotingAgainst(false)
    }
  }

  const handleOpenRemovalDialog = () => {
    if (!address) {
      toast.error('请先连接钱包')
      return
    }
    if (!removalEligibility.eligible) {
      toast.error(removalRequirementHint)
      return
    }
    setRemovalDialogOpen(true)
  }

  const handleInitiateRemoval = async () => {
    if (!removalEligibility.eligible) {
      toast.error(removalRequirementHint)
      return
    }
    try {
      const durationSeconds = Math.max(1, Number(removalDurationHours)) * 3600
      await initiateRemovalVote(proposal.id, removalReason, durationSeconds)
      toast.success('删除投票已发起')
      setRemovalDialogOpen(false)
      setRemovalReason('')
      refetchRemoval()
    } catch (error) {
      console.error('发起删除投票失败:', error)
      toast.error((error as Error).message)
    }
  }

  const handleRemovalVote = async (support: boolean) => {
    if (!address) {
      toast.error('请先连接钱包')
      return
    }
    if (!canVoteOnRemoval) {
      toast.error(removalRequirementHint)
      return
    }
    try {
      if (support) {
        setRemovalVotingFor(true)
      } else {
        setRemovalVotingAgainst(true)
      }
      await voteRemoval(proposal.id, support)
      toast.success(`删除投票${support ? '支持' : '反对'}成功`)
      refetchRemoval()
      refetchRemovalVoteStatus()
    } catch (error) {
      console.error('删除投票失败:', error)
      toast.error((error as Error).message)
    } finally {
      setRemovalVotingFor(false)
      setRemovalVotingAgainst(false)
    }
  }

  const handleFinalizeRemoval = async () => {
    try {
      await finalizeRemovalVote(proposal.id)
      toast.success('删除投票已结算')
      refetchRemoval()
      refetch()
    } catch (error) {
      console.error('结算删除投票失败:', error)
      toast.error((error as Error).message)
    }
  }

  const formattedGovBalance = parseFloat(formatUnits(removalEligibility.balance, 18)).toFixed(2)

  return (
    <>
      <Card variant="glass" hover className="group">
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                <Vote className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <Badge variant={getStatusColor(proposal.status)}>
                    {getStatusText(proposal.status)}
                  </Badge>
                  {isActive && (
                    <Badge variant="outline" className="ml-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {daysLeft}天后结束
                    </Badge>
                  )}
                </div>
                {removal && !proposal.removed && (
                  <Badge variant="error" className="w-max">
                    <ShieldAlert className="w-3 h-3 mr-1" />恶意删除投票中
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>提案 #{proposal.id}</div>
              <div>截止: {new Date(proposal.endTime).toLocaleString()}</div>
            </div>
          </div>

          <CardTitle className="text-xl mb-2">
            {proposal.description.split('\n')[0]}
          </CardTitle>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {proposal.description.split('\n').slice(1).join('\n') || '—'}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">提案人: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">支持票</span>
                <span className="text-sm font-medium text-green-400">
                  {proposal.forVotes.toLocaleString()} ({votePercentage.toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={proposal.forVotes}
                max={proposal.totalVotes > 0 ? proposal.totalVotes : 1}
                variant="success"
                glow
                size="sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">反对票</span>
                <span className="text-sm font-medium text-red-400">
                  {proposal.againstVotes.toLocaleString()} ({proposal.totalVotes > 0 ? (100 - votePercentage).toFixed(1) : '0.0'}%)
                </span>
              </div>
              <Progress
                value={proposal.againstVotes}
                max={proposal.totalVotes > 0 ? proposal.totalVotes : 1}
                variant="danger"
                glow
                size="sm"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                <span>总投票数: {proposal.totalVotes.toLocaleString()}</span>
                <span>参与率: {((proposal.totalVotes / 5000) * 100).toFixed(1)}%</span>
              </div>

              {isActive && !isRemoved ? (
                <div className="flex gap-3">
                  <Button
                    variant={votingFor ? 'secondary' : 'primary'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleVote(true)}
                    disabled={isPending || isApproving || votingFor || votingAgainst}
                  >
                    {votingFor ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isApproving ? '授权中...' : '提交中...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        支持
                      </>
                    )}
                  </Button>
                  <Button
                    variant={votingAgainst ? 'primary' : 'secondary'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleVote(false)}
                    disabled={isPending || isApproving || votingFor || votingAgainst}
                  >
                    {votingAgainst ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isApproving ? '授权中...' : '提交中...'}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        反对
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="w-full" disabled>
                  {isRemoved ? '提案已删除' : '投票已结束'}
                </Button>
              )}
            </div>

            {isRemoved && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                <ShieldAlert className="w-5 h-5 mt-1" />
                <div>
                  <div className="font-semibold">恶意提案已被删除</div>
                  <p className="text-sm mt-1">
                    删除投票通过，提案创建者的 50% GOV 已被没收，防止恶意提案危害 DAO。
                  </p>
                </div>
              </div>
            )}

            {!isRemoved && (
              <div className="mt-6 space-y-4">
                {removal ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-primary-foreground">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-sm font-semibold text-primary">恶意提案删除投票</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        截止: {new Date(removal.endTime).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{removal.reason}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md bg-green-500/10 px-3 py-2 text-green-200">
                        <div className="text-xs uppercase tracking-wide text-green-300/80">支持删除</div>
                        <div className="text-lg font-semibold">{removal.yesVotes}</div>
                      </div>
                      <div className="rounded-md bg-red-500/10 px-3 py-2 text-red-200">
                        <div className="text-xs uppercase tracking-wide text-red-300/80">反对删除</div>
                        <div className="text-lg font-semibold">{removal.noVotes}</div>
                      </div>
                    </div>

                    {removalActive && (
                      <div className="mt-4 flex gap-3">
                        <Button
                          variant={removalVotingFor ? 'secondary' : 'danger'}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRemovalVote(true)}
                          disabled={isVotingRemoval || removalVotingFor || removalVotingAgainst || !canVoteOnRemoval}
                        >
                          {removalVotingFor ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          支持删除
                        </Button>
                        <Button
                          variant={removalVotingAgainst ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRemovalVote(false)}
                          disabled={isVotingRemoval || removalVotingFor || removalVotingAgainst || !canVoteOnRemoval}
                        >
                          {removalVotingAgainst ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          反对删除
                        </Button>
                      </div>
                    )}

                    {canVoteOnRemoval ? (
                      <p className="mt-2 text-xs text-gray-300">
                        你的 GOV 余额约为 {formattedGovBalance}，符合当前删除投票参与门槛。
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">{removalRequirementHint}</p>
                    )}

                    {canFinalizeRemoval && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={handleFinalizeRemoval}
                        disabled={isFinalizingRemoval}
                      >
                        {isFinalizingRemoval ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Hammer className="w-4 h-4 mr-2" />
                        )}
                        结算删除投票
                      </Button>
                    )}

                    {removalExecuted && (
                      <div className={`mt-4 rounded-md px-3 py-2 text-sm ${proposal.removed ? 'bg-red-500/10 text-red-200' : 'bg-green-500/10 text-green-200'}`}>
                        {proposal.removed ? '删除投票已通过，提案已被移除。' : '删除投票未通过，提案继续保留。'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-white">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-sm font-semibold">尚未发起恶意删除投票</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">{removalRequirementHint}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={handleOpenRemovalDialog}
                      disabled={isInitiatingRemoval}
                    >
                      发起删除投票
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isRemovalDialogOpen} onOpenChange={setRemovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发起恶意提案删除投票</DialogTitle>
            <DialogDescription>
              删除投票将立即通知所有成员参与二次表决，若通过将删除该提案并没收提案人 50% GOV。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">删除理由</label>
              <textarea
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                value={removalReason}
                onChange={(event) => setRemovalReason(event.target.value)}
                placeholder="说明此提案为何被视为恶意或对社区有害"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">投票持续时间（小时）</label>
              <Input
                type="number"
                min={1}
                value={removalDurationHours}
                onChange={(event) => setRemovalDurationHours(Number(event.target.value))}
              />
              <p className="text-xs text-gray-400">最少 1 小时。建议 24 小时以上给予社区充分决策时间。</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemovalDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleInitiateRemoval}
              disabled={isInitiatingRemoval || !removalReason.trim()}
            >
              {isInitiatingRemoval ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              确认发起
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function GovernancePage() {
  const { count, isLoading: isCountLoading } = useProposalCount()
  const { balance } = useGovTokenBalance()
  const { eligibility: removalEligibility } = useRemovalEligibility()
  const [proposalIds, setProposalIds] = useState<number[]>([])
  
  // 添加创建提案相关的状态和钩子
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [proposalDesc, setProposalDesc] = useState('')
  // 修改持续时间的状态管理方式
  const [days, setDays] = useState(1)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const {
    createProposal,
    isPending: isCreatingProposal,
    isApproving: isApprovingProposal,
  } = useCreateProposal()
  const isProposalSubmitting = isCreatingProposal || isApprovingProposal
  
  // 计算总秒数
  const calculateDurationInSeconds = () => {
    return days * 86400 + hours * 3600 + minutes * 60
  }
  
  // 处理创建提案
  const handleCreateProposal = async () => {
    if (!proposalDesc.trim()) {
      toast.error('请输入提案描述')
      return
    }
    
    const durationInSeconds = calculateDurationInSeconds()
    if (durationInSeconds < 60) {
      toast.error('提案持续时间至少需要1分钟')
      return
    }

    try {
      const result = await createProposal(proposalDesc, durationInSeconds)

      if (result?.approvalHash) {
        toast.success(`授权成功，额度 ${formatUnits(GOV_PROPOSAL_FEE, 18)} GOV`)
      }

      toast.success('提案创建成功！')
      setIsDialogOpen(false)
      setProposalDesc('')
      // 刷新提案列表
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('创建提案失败:', error)
      const stage = (error as { stage?: string }).stage
      const message = (error as Error).message || '操作失败'

      if (stage === 'approval') {
        toast.error(`授权失败：${message}`)
      } else if (stage === 'proposal') {
        toast.error(`创建提案失败：${message}`)
      } else if (stage === 'wallet') {
        toast.error(message)
      } else {
        toast.error(`创建提案失败：${message}`)
      }
    }
  }

  useEffect(() => {
    if (count > 0) {
      // 从最新的提案开始
      const ids = Array.from({ length: Number(count) }, (_, i) => Number(count) - i)
      setProposalIds(ids)
    }
  }, [count])

  // 更新统计数据
  const updatedStats = [
    { ...stats[0], value: `${count}` },
    { ...stats[1], value: '计算中...' },
    { ...stats[2], value: balance },
    { ...stats[3], value: '计算中...' }
  ]

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DAO 治理</h1>
          <p className="text-gray-300">
            参与社区决策，塑造项目未来。首次投票或创建提案时需要先授权 GOV 代币，请在钱包中依次确认授权与操作交易。
          </p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {updatedStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} variant="glass" hover className="group">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-${stat.color}/20 to-${stat.color}/10 flex items-center justify-center group-hover:animate-glow`}>
                      <Icon className={`w-6 h-6 text-${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              glow
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              创建提案
            </Button>
            <Button variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" size="sm">全部</Button>
            <Button variant="ghost" size="sm">投票中</Button>
            <Button variant="ghost" size="sm">已结束</Button>
          </div>
        </div>

        {/* 提案列表 */}
        {isCountLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">加载提案中...</span>
          </div>
        ) : proposalIds.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {proposalIds.map((id) => (
              <ProposalCard key={id} proposalId={id} removalEligibility={removalEligibility} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400">暂无提案</p>
          </div>
        )}

        {/* 用户治理信息 */}
        <Card variant="neon" className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              我的治理状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{balance}</div>
                <div className="text-sm text-gray-400">GOV代币余额</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary mb-1">计算中...</div>
                <div className="text-sm text-gray-400">参与投票次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent mb-1">计算中...</div>
                <div className="text-sm text-gray-400">创建提案数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 创建提案弹窗 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新提案</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">提案描述</label>
                <Input
                  placeholder="输入提案描述..."
                  value={proposalDesc}
                  onChange={(e) => setProposalDesc(e.target.value)}
                  className="bg-surface/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">投票持续时间</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">天</label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      placeholder="天"
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                      className="bg-surface/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">小时</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="小时"
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                      className="bg-surface/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">分钟</label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="分钟"
                      value={minutes}
                      onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                      className="bg-surface/30"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  总持续时间: {days}天 {hours}小时 {minutes}分钟 ({calculateDurationInSeconds()}秒)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button
                variant="primary"
                onClick={handleCreateProposal}
                disabled={
                  isProposalSubmitting ||
                  !proposalDesc.trim() ||
                  calculateDurationInSeconds() < 60
                }
              >
                {isApprovingProposal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    授权中...
                  </>
                ) : isCreatingProposal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    创建提案
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 