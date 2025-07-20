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
  Calendar,
  User,
  Filter,
  Search,
  Loader2
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { useProposalCount, useProposal, useVote, useCreateProposal } from '@/hooks/useGovernance'
import { useGovTokenBalance } from '@/hooks/useTokenBalance'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'

// 统计数据 - 这部分后续会改为真实数据
const stats = [
  { label: '活跃提案', value: '0', icon: Vote, color: 'primary' },
  { label: '总投票数', value: '0', icon: Users, color: 'secondary' },
  { label: '治理代币', value: '0', icon: Coins, color: 'accent' },
  { label: '参与率', value: '0%', icon: TrendingUp, color: 'success' }
]

const ProposalCard = ({ proposalId }: { proposalId: number }) => {
  const { proposal, isLoading, error, refetch } = useProposal(proposalId)
  const { vote, isPending } = useVote()
  const { address } = useAccount()
  const [votingFor, setVotingFor] = useState(false)
  const [votingAgainst, setVotingAgainst] = useState(false)

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

  if (error || !proposal) {
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
      case 'active': return 'warning'
      case 'passed': return 'success'
      case 'rejected': return 'danger'
      default: return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '投票中'
      case 'passed': return '已通过'
      case 'rejected': return '未通过'
      default: return '未知'
    }
  }

  const votePercentage = proposal.totalVotes > 0 
    ? (proposal.forVotes / proposal.totalVotes) * 100 
    : 0

  const isActive = proposal.status === 'active'
  const timeLeft = isActive ? proposal.endTime - Date.now() : 0
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)))

  const handleVote = async (support: boolean) => {
    if (!address) {
      toast.error('请先连接钱包')
      return
    }

    try {
      if (support) {
        setVotingFor(true)
      } else {
        setVotingAgainst(true)
      }

      await vote(proposal.id, support)
      toast.success(`投票${support ? '支持' : '反对'}成功`)
      refetch()
    } catch (error) {
      console.error('投票失败:', error)
      toast.error((error as Error).message)
    } finally {
      setVotingFor(false)
      setVotingAgainst(false)
    }
  }

  return (
    <Card variant="glass" hover className="group">
      <CardHeader>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
              <Vote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Badge variant={getStatusColor(proposal.status)}>
                {getStatusText(proposal.status)}
              </Badge>
              {isActive && (
                <Badge variant="ghost" className="ml-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {daysLeft}天后结束
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div>提案 #{proposal.id}</div>
            <div>{new Date(proposal.startTime).toLocaleDateString()}</div>
          </div>
        </div>

        <CardTitle className="text-xl mb-2">
          {proposal.description.split('\n')[0]}
        </CardTitle>
        <p className="text-gray-300 text-sm leading-relaxed">
          {proposal.description.split('\n').slice(1).join('\n')}
        </p>

        <div className="flex items-center gap-2 mt-3">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">提案人: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
        </div>
      </CardHeader>

      <CardContent>
        {/* 投票进度 */}
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
              max={proposal.totalVotes}
              variant="success"
              glow
              size="sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">反对票</span>
              <span className="text-sm font-medium text-red-400">
                {proposal.againstVotes.toLocaleString()} ({(100 - votePercentage).toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={proposal.againstVotes} 
              max={proposal.totalVotes}
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

            {isActive ? (
              <div className="flex gap-3">
                <Button 
                  variant={votingFor ? "secondary" : "primary"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleVote(true)}
                  disabled={isPending || votingFor || votingAgainst}
                >
                  {votingFor ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  支持
                </Button>
                <Button 
                  variant={votingAgainst ? "primary" : "secondary"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleVote(false)}
                  disabled={isPending || votingFor || votingAgainst}
                >
                  {votingAgainst ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  反对
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="w-full" disabled>
                投票已结束
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GovernancePage() {
  const { count, isLoading: isCountLoading } = useProposalCount()
  const { balance } = useGovTokenBalance()
  const [proposalIds, setProposalIds] = useState<number[]>([])
  
  // 添加创建提案相关的状态和钩子
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [proposalDesc, setProposalDesc] = useState('')
  // 修改持续时间的状态管理方式
  const [days, setDays] = useState(1)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const { createProposal } = useCreateProposal()
  
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
      setIsCreating(true)
      await createProposal(proposalDesc, durationInSeconds)
      toast.success('提案创建成功！')
      setIsDialogOpen(false)
      setProposalDesc('')
      // 刷新提案列表
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('创建提案失败:', error)
      toast.error(`创建提案失败: ${(error as Error).message}`)
    } finally {
      setIsCreating(false)
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
          <p className="text-gray-300">参与社区决策，塑造项目未来</p>
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
              <ProposalCard key={id} proposalId={id} />
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
                disabled={isCreating || !proposalDesc.trim() || calculateDurationInSeconds() < 60}
              >
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {isCreating ? '创建中...' : '创建提案'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 