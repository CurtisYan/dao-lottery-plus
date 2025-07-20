'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  Zap, 
  Trophy, 
  Users, 
  Coins,
  Clock,
  Star,
  Gift,
  History,
  Play,
  Crown,
  Sparkles,
  Target,
  Calendar,
  TrendingUp,
  Loader2,
  Check
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { 
  usePrizeInfo, 
  useParticipants, 
  useIsParticipant,
  useLotteryEligibility
} from '@/hooks/useLottery'
import { useProposalCount } from '@/hooks/useGovernance'
import { toast } from 'sonner'
import { useGovBalance } from '@/hooks/useGovBalance'
import { formatEther } from '@/lib/utils'

// 参与者卡片组件
const ParticipantCard: React.FC<{ 
  address: string, 
  index: number,
  govBalance?: number | string,
  joinedAt?: string,
  totalGovStaked: bigint
}> = ({ 
  address, 
  index,
  govBalance = '0', 
  joinedAt = '未知',
  totalGovStaked
}) => {
  // 计算概率，确保在0-100%之间
  const calculateProbability = () => {
    if (!totalGovStaked || totalGovStaked <= 0) return 0;
    
    try {
      const balance = typeof govBalance === 'string' ? BigInt(govBalance) : BigInt(govBalance.toString());
      if (balance <= 0) return 0;
      
      const percentage = Number((balance * BigInt(10000)) / totalGovStaked) / 100;
      return Math.min(Math.max(percentage, 0), 100);
    } catch (error) {
      console.error("概率计算错误:", error);
      return 0;
    }
  };

  const probability = calculateProbability();

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-surface/30 backdrop-blur-sm border border-white/5 hover:border-primary/30 transition-all duration-300 group">
      {/* 排名 */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center text-sm font-medium text-white">
        {index + 1}
      </div>
      
      {/* 头像 */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
        <Users className="w-5 h-5 text-white" />
      </div>
      
      {/* 信息 */}
      <div className="flex-1">
        <div className="text-white font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <div className="text-sm text-gray-400">
          GOV: {typeof govBalance === 'bigint' ? formatEther(govBalance) : govBalance} • 加入: {joinedAt}
        </div>
      </div>
      
      {/* 中奖概率 */}
      <div className="text-right">
        <div className="text-primary font-medium">
          {probability.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-400">中奖概率</div>
      </div>
    </div>
  )
}

// 历史记录卡片组件
const HistoryCard: React.FC<{ 
  round: number,
  winner: string,
  rewardAmount: bigint | number,
  govAmount: bigint | number,
  date: string,
  participants: number
}> = ({ 
  round, 
  winner, 
  rewardAmount, 
  govAmount, 
  date, 
  participants 
}) => {
  return (
    <Card variant="glass" hover className="group">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent/20 to-yellow-400/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-white font-medium">第 {round} 轮</div>
              <div className="text-sm text-gray-400">{date}</div>
            </div>
          </div>
          <Badge variant="success">
            <Trophy className="w-3 h-3 mr-1" />
            已开奖
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">中奖者</span>
            <span className="text-white font-medium">
              {winner.slice(0, 6)}...{winner.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">奖励代币</span>
            <span className="text-accent font-medium">{formatEther(BigInt(rewardAmount))} REWARD</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">治理代币</span>
            <span className="text-primary font-medium">{formatEther(BigInt(govAmount))} GOV</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">参与人数</span>
            <span className="text-secondary font-medium">{participants}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 带余额的参与者组件
const ParticipantWithBalance: React.FC<{
  address: string, 
  index: number,
  participantCount: number,
  participants: readonly `0x${string}`[] // 修复类型错误
}> = ({ 
  address, 
  index,
  participantCount,
  participants
}) => {
  // 从链上获取GOV余额
  const { balance, isLoading } = useGovBalance(address as `0x${string}`);
  
  // 计算概率 - 使用更合理的方法
  const calculateProbability = () => {
    // 如果只有一个参与者，概率为100%
    if (participantCount === 1) return 100;
    
    // 如果有多个参与者，平均分配概率
    const basePercentage = 100 / participantCount;
    
    // 根据GOV余额调整概率（余额越高，概率越高）
    if (balance > 0) {
      // 简单的概率调整：余额越高，概率越高，但不超过基础概率的2倍
      const balanceMultiplier = Math.min(Number(balance) / 100, 2); // 最多2倍
      return Math.min(basePercentage * balanceMultiplier, 100);
    }
    
    return basePercentage;
  };

  const probability = calculateProbability();

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-surface/30 backdrop-blur-sm border border-white/5 hover:border-primary/30 transition-all duration-300 group">
      {/* 排名 */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center text-sm font-medium text-white">
        {index + 1}
      </div>
      
      {/* 头像 */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
        <Users className="w-5 h-5 text-white" />
      </div>
      
      {/* 信息 */}
      <div className="flex-1">
        <div className="text-white font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <div className="text-sm text-gray-400">
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 
              加载中...
            </span>
          ) : (
            <>GOV: {formatEther(balance)} • <span className="text-primary">投票正确</span></>
          )}
        </div>
      </div>
      
      {/* 中奖概率 */}
      <div className="text-right">
        <div className="text-primary font-medium">
          {probability.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-400">中奖概率</div>
      </div>
    </div>
  )
}

export default function LotteryPage() {
  const { address } = useAccount()
  const { 
    prizeInfo, 
    isError: isPrizeError, 
    isLoading: isPrizeLoading,
    refetch: refetchPrize
  } = usePrizeInfo()
  
  const {
    participants,
    participantCount,
    isError: isParticipantError,
    isLoading: isParticipantLoading,
    refetch: refetchParticipants
  } = useParticipants()
  
  const { isParticipant, isError: isParticipantCheckError } = useIsParticipant()
  const { count: proposalCount, isError: isProposalError } = useProposalCount()
  const { isEligible, govBalance, isLoading: isEligibilityLoading, requiredAmount } = useLotteryEligibility()
  
  // 处理加载和错误状态
  const isLoading = isPrizeLoading || isParticipantLoading || isEligibilityLoading
  const hasError = isPrizeError || isParticipantError || isParticipantCheckError || isProposalError
  
  // 动态生成统计数据
  const stats = [
    { 
      label: '当前奖池', 
      value: isLoading ? '...' : hasError ? '错误' : formatEther(prizeInfo.rewardAmount), 
      unit: 'REWARD', 
      icon: Coins, 
      color: 'accent' 
    },
    { 
      label: '参与人数', 
      value: isLoading ? '...' : hasError ? '错误' : participantCount.toString(), 
      icon: Users, 
      color: 'primary' 
    },
    { 
      label: '下次开奖', 
      value: '3天', // 这个值可能需要从智能合约获取，暂时保留
      icon: Clock, 
      color: 'secondary' 
    },
    { 
      label: '历史奖池', 
      value: isLoading ? '...' : hasError ? '错误' : formatEther(prizeInfo.totalPrize), 
      unit: 'REWARD', 
      icon: Trophy, 
      color: 'success' 
    }
  ]

  // 真实的历史数据应该从区块链获取，这里暂时使用空数组
  const lotteryHistory: {
    round: number;
    winner: string;
    rewardAmount: bigint;
    govAmount: bigint;
    date: string;
    participants: number;
  }[] = []
  
  // 模拟管理员权限
  const isAdmin = false // 实际应用中应该检查当前钱包是否有管理员权限
  
  // 处理开奖操作
  const handleDrawWinner = async () => {
    if (!address) {
      toast.error("请先连接钱包")
      return
    }
    
    if (!isAdmin) {
      toast.error("只有管理员可以进行开奖")
      return
    }
    
    try {
      // 这里应该调用抽奖合约的开奖函数
      toast.success("开奖成功!")
      // 刷新数据
      refetchPrize()
      refetchParticipants()
    } catch (error) {
      console.error("开奖失败:", error)
      toast.error(`开奖失败: ${(error as Error).message}`)
    }
  }
  
  // 如果有错误，处理重试
  const handleRetry = () => {
    refetchPrize()
    refetchParticipants()
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            <Zap className="w-8 h-8 inline-block mr-3 text-accent" />
            抽奖系统
          </h1>
          <p className="text-gray-300">持有GOV代币即可参与，奖励自动分发</p>
          
          {/* 移除错误的参与按钮，改为显示参与说明 */}
          {address && (
            <div className="mt-4 p-4 bg-surface/30 rounded-lg border border-primary/20">
              <h3 className="text-lg font-semibold text-white mb-2">如何参与抽奖？</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• 持有至少 {!isEligibilityLoading ? formatEther(requiredAmount) : '...'} 个 GOV 代币</p>
                <p>• 在治理页面参与提案投票</p>
                <p>• 投票正确的用户自动进入抽奖池</p>
                <p>• 等待管理员开奖</p>
              </div>
              
              {/* 显示用户资格状态 */}
              {!isEligibilityLoading && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <div className="text-sm text-gray-300">
                    您的GOV余额: <span className="text-white font-medium">{formatEther(govBalance)}</span>
                  </div>
                  <Badge variant={isEligible ? "success" : "error"} className="text-xs">
                    {isEligible ? "有资格参与" : "余额不足"}
                  </Badge>
                  {!isEligible && (
                    <Badge variant="warning" className="text-xs">
                      至少持有 {formatEther(requiredAmount)} GOV
                    </Badge>
                  )}
                </div>
              )}
              
              <Button 
                variant="secondary" 
                size="sm" 
                className="mt-3"
                onClick={() => window.location.href = '/governance'}
              >
                前往治理页面
              </Button>
            </div>
          )}
          
          {/* 显示已参与状态 - 需要检查用户是否在抽奖池中 */}
          {isParticipant && (
            <Badge variant="success" className="mt-4 text-lg py-2 px-4">
              <Check className="w-5 h-5 mr-2" />
              您已在抽奖池中
            </Badge>
          )}
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} variant="glass" hover className="group">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-${stat.color}/20 to-${stat.color}/10 flex items-center justify-center mx-auto mb-3 group-hover:animate-glow`}>
                      <Icon className={`w-6 h-6 text-${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                      {stat.unit && <span className="text-sm text-gray-400 ml-1">{stat.unit}</span>}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 奖池大屏 */}
        <Card variant="neon" className="mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10" />
          <CardContent className="relative z-10 py-12">
            <div className="text-center">
              <div className="flex justify-center items-center gap-4 mb-6">
                <Gift className="w-12 h-12 text-accent animate-glow" />
                <h2 className="text-4xl font-bold text-white">当前奖池</h2>
                <Gift className="w-12 h-12 text-accent animate-glow" />
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mr-2" />
                  <span className="text-xl text-gray-300">加载中...</span>
                </div>
              ) : hasError ? (
                <div className="py-8">
                  <div className="text-xl text-red-400 mb-4">获取数据失败</div>
                  <Button variant="secondary" onClick={handleRetry}>
                    重试
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary animate-glow mb-2">
                      {formatEther(prizeInfo.rewardAmount)} REWARD
                    </div>
                    <div className="text-2xl text-gray-300">+ {formatEther(prizeInfo.govAmount)} GOV</div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{participantCount.toString()}</div>
                      <div className="text-sm text-gray-400">参与人数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{formatEther(prizeInfo.totalPrize)}</div>
                      <div className="text-sm text-gray-400">总奖励</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">72小时</div>
                      <div className="text-sm text-gray-400">距离开奖</div>
                    </div>
                  </div>
                </>
              )}

              {isAdmin && (
                <Button 
                  size="xl" 
                  glow 
                  className="animate-pulse"
                  onClick={handleDrawWinner}
                  disabled={isLoading || hasError || participantCount === 0}
                >
                  <Play className="w-6 h-6 mr-3" />
                  立即开奖
                  <Sparkles className="w-6 h-6 ml-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 参与者列表 */}
          <div>
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  参与者列表
                  <Badge variant="secondary">{participantCount.toString()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
                    <span>加载中...</span>
                  </div>
                ) : hasError ? (
                  <div className="text-center py-8">
                    <div className="text-red-400 mb-4">获取参与者失败</div>
                    <Button variant="secondary" onClick={handleRetry}>重试</Button>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    暂无参与者
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant, index) => (
                      <ParticipantWithBalance 
                        key={participant} 
                        address={participant}
                        index={index}
                        participantCount={participantCount}
                        participants={participants} // 传递所有参与者列表
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 中奖历史 */}
          <div>
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <History className="w-6 h-6 text-accent" />
                  中奖历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-accent animate-spin mr-2" />
                    <span>加载中...</span>
                  </div>
                ) : hasError ? (
                  <div className="text-center py-8">
                    <div className="text-red-400 mb-4">获取历史记录失败</div>
                    <Button variant="secondary" onClick={handleRetry}>重试</Button>
                  </div>
                ) : lotteryHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    暂无抽奖历史记录
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lotteryHistory.map((record) => (
                      <HistoryCard
                        key={record.round}
                        round={record.round}
                        winner={record.winner}
                        rewardAmount={record.rewardAmount}
                        govAmount={record.govAmount}
                        date={record.date}
                        participants={record.participants}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 参与规则 */}
        <Card variant="glass" className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="w-6 h-6 text-secondary" />
              抽奖规则详情
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary font-bold">1</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">参与资格</div>
                    <div className="text-sm text-gray-400">参与治理提案投票并投票正确（与最终通过结果一致）的用户自动获得抽奖资格</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary font-bold">2</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">奖池构成</div>
                    <div className="text-sm text-gray-400">每个正确投票贡献1个GOV到奖池 + 固定100GOV基础奖励</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary font-bold">3</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">概率计算</div>
                    <div className="text-sm text-gray-400">使用区块链随机数机制，从所有正确投票的用户中随机选择一位获胜者</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-accent font-bold">4</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">奖励分配</div>
                    <div className="text-sm text-gray-400">80% 奖池转换为REWARD代币奖励给中奖者，20% GOV被销毁以减少通胀</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-accent font-bold">5</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">额外奖励</div>
                    <div className="text-sm text-gray-400">中奖者额外获得11个GOV代币奖励，所有正确投票者都获得参与NFT</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-accent font-bold">6</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">开奖时机</div>
                    <div className="text-sm text-gray-400">每个治理提案结束并确认结果后进行一次抽奖，由管理员触发</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-surface/20 rounded-lg border border-primary/10">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-accent" />
                抽奖机制说明
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                本抽奖系统与治理紧密结合，鼓励用户积极参与DAO治理。只有参与提案投票且投票结果与最终通过结果一致的用户才能获得抽奖资格。
                投票时需要消耗1个GOV代币，这些代币将被收集到奖池中，再加上基础100GOV。
                中奖者将获得80%的奖池价值（以REWARD代币形式），剩余20%的GOV将被销毁以减轻通胀压力。
                此外，中奖者还将额外获得11个GOV代币作为奖励。所有正确投票的参与者都会获得一枚参与NFT，无论是否中奖。
                抽奖使用区块链随机数机制，确保公平性和透明度。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
