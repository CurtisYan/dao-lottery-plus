"use client";
import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  BarChart3,
  Wallet,
  TrendingUp,
  Activity,
  Award,
  Coins,
  Vote,
  Zap,
  Gift,
  Star,
  Clock,
  ArrowUp,
  ArrowDown,
  Plus,
  ExternalLink,
  Trophy,
  Target,
  Calendar,
  Users,
  Sparkles
} from 'lucide-react'
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts'
import { useState, useEffect } from 'react'
import { formatEther } from '@/lib/utils';

// 模拟用户数据
const userAssets = {
  govBalance: 1250,
  rewardBalance: 3420,
  nftCount: 3,
  totalVotes: 15,
  proposalsCreated: 2,
  lotteryWins: 0,
  memberSince: "2023-12-15"
}

// 模拟活动记录
const activities = [
  {
    id: 1,
    type: "vote",
    title: "对提案 #3 投票",
    description: "支持 \"优化治理代币分发机制\"",
    timestamp: "2024-01-12T10:30:00Z",
    icon: Vote,
    color: "primary"
  },
  {
    id: 2,
    type: "reward",
    title: "获得奖励",
    description: "收到 50 REWARD 代币",
    timestamp: "2024-01-10T15:45:00Z",
    icon: Gift,
    color: "accent"
  },
  {
    id: 3,
    type: "nft",
    title: "获得NFT",
    description: "解锁 \"治理专家\" 徽章",
    timestamp: "2024-01-08T09:20:00Z",
    icon: Award,
    color: "secondary"
  },
  {
    id: 4,
    type: "proposal",
    title: "创建提案",
    description: "提交 \"调整奖池分配比例\" 提案",
    timestamp: "2024-01-05T14:10:00Z",
    icon: Plus,
    color: "success"
  },
  {
    id: 5,
    type: "lottery",
    title: "参与抽奖",
    description: "加入第15轮抽奖",
    timestamp: "2024-01-03T11:00:00Z",
    icon: Zap,
    color: "warning"
  }
]

// 模拟成就数据
const achievements = [
  {
    id: 1,
    name: "治理新人",
    description: "完成首次投票",
    icon: Vote,
    unlocked: true,
    progress: 100,
    color: "primary"
  },
  {
    id: 2,
    name: "活跃参与者",
    description: "参与10次投票",
    icon: TrendingUp,
    unlocked: true,
    progress: 100,
    color: "secondary"
  },
  {
    id: 3,
    name: "提案达人",
    description: "创建5个提案",
    icon: Target,
    unlocked: false,
    progress: 40,
    color: "accent"
  },
  {
    id: 4,
    name: "抽奖幸运儿",
    description: "赢得一次抽奖",
    icon: Trophy,
    unlocked: false,
    progress: 0,
    color: "warning"
  }
]

// 统计数据
const stats = [
  { 
    label: 'GOV 代币', 
    value: userAssets.govBalance.toLocaleString(), 
    change: '+125',
    changeType: 'up',
    icon: Coins, 
    color: 'primary' 
  },
  { 
    label: 'REWARD 代币', 
    value: userAssets.rewardBalance.toLocaleString(), 
    change: '+420',
    changeType: 'up',
    icon: Gift, 
    color: 'accent' 
  },
  { 
    label: '拥有 NFT', 
    value: userAssets.nftCount.toString(), 
    change: '+1',
    changeType: 'up',
    icon: Award, 
    color: 'secondary' 
  },
  { 
    label: '投票参与', 
    value: userAssets.totalVotes.toString(), 
    change: '+3',
    changeType: 'up',
    icon: Vote, 
    color: 'success' 
  }
]

// 快捷操作
const quickActions = [
  {
    title: "参与治理",
    description: "查看活跃提案并投票",
    icon: Vote,
    color: "primary",
    href: "/governance"
  },
  {
    title: "抽奖系统",
    description: "查看当前奖池",
    icon: Zap,
    color: "accent",
    href: "/lottery"
  },
  {
    title: "NFT收藏",
    description: "管理我的NFT",
    icon: Award,
    color: "secondary",
    href: "/nft"
  },
  {
    title: "创建提案",
    description: "提交新的治理提案",
    icon: Plus,
    color: "success",
    href: "/governance/create"
  }
]

const AssetCard: React.FC<{ stat: typeof stats[0] }> = ({ stat }) => {
  const Icon = stat.icon
  const ChangeIcon = stat.changeType === 'up' ? ArrowUp : ArrowDown
  
  return (
    <Card variant="glass" hover className="group">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-${stat.color}/20 to-${stat.color}/10 flex items-center justify-center group-hover:animate-glow`}>
              <Icon className={`w-6 h-6 text-${stat.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-sm ${
            stat.changeType === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            <ChangeIcon className="w-4 h-4" />
            {stat.change}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ActivityItem: React.FC<{ activity: typeof activities[0] }> = ({ activity }) => {
  const Icon = activity.icon
  const timeAgo = new Date(Date.now() - new Date(activity.timestamp).getTime()).getDate() + "天前"
  
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-surface/20 backdrop-blur-sm border border-white/5 hover:border-primary/30 transition-all duration-300">
      <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-${activity.color}/20 to-${activity.color}/10 flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 text-${activity.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium">{activity.title}</div>
        <div className="text-sm text-gray-400 mt-1">{activity.description}</div>
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </div>
      </div>
    </div>
  )
}

const AchievementCard: React.FC<{ achievement: typeof achievements[0] }> = ({ achievement }) => {
  const Icon = achievement.icon
  
  return (
    <Card 
      variant="glass" 
      hover 
      className={`group ${!achievement.unlocked ? 'opacity-70' : ''}`}
    >
      <CardContent className="pt-6">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-${achievement.color}/20 to-${achievement.color}/10 flex items-center justify-center mx-auto mb-4 ${
            achievement.unlocked ? 'group-hover:animate-glow' : ''
          }`}>
            <Icon className={`w-8 h-8 text-${achievement.color}`} />
          </div>
          
          <h3 className="text-white font-semibold mb-2">{achievement.name}</h3>
          <p className="text-gray-400 text-sm mb-4">{achievement.description}</p>
          
          {achievement.unlocked ? (
            <Badge variant="success">
              <Star className="w-3 h-3 mr-1" />
              已解锁
            </Badge>
          ) : (
            <div className="space-y-2">
              <Progress 
                value={achievement.progress} 
                max={100}
                variant={achievement.color as any}
                size="sm"
                showLabel
                label={`进度 ${achievement.progress}%`}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const QuickActionCard: React.FC<{ action: typeof quickActions[0] }> = ({ action }) => {
  const Icon = action.icon
  
  return (
    <Card variant="glass" hover className="group cursor-pointer">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-${action.color}/20 to-${action.color}/10 flex items-center justify-center mx-auto mb-4 group-hover:animate-glow`}>
            <Icon className={`w-6 h-6 text-${action.color}`} />
          </div>
          <h3 className="text-white font-semibold mb-2">{action.title}</h3>
          <p className="text-gray-400 text-sm">{action.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// NFT hooks from profile page
function useNftBalance(nftAddress: string) {
  const { address } = useAccount()
  const { data: balance, isLoading } = useReadContract({
    address: nftAddress as `0x${string}`,
    abi: ABIS.ERC721,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  })
  return { balance: balance ? Number(balance) : 0, isLoading }
}
function useUserNfts(nftAddress: string, balance: number) {
  const { address } = useAccount()
  const [nfts, setNfts] = useState<{ tokenId: number, tokenURI: string }[]>([])
  useEffect(() => {
    if (!address || !nftAddress || balance === 0) {
      setNfts([])
      return
    }
    let cancelled = false
    async function fetchNfts() {
      const items: { tokenId: number, tokenURI: string }[] = []
      for (let i = 1; i <= Math.min(balance, 6); i++) {
        try {
          if (!window.ethereum) {
            continue;
          }
          // @ts-ignore
          const owner = await window.ethereum.request({
            method: 'eth_call',
            params: [{
              to: nftAddress,
              data: '0x6352211e' + i.toString(16).padStart(64, '0')
            }, 'latest']
          })
          if (owner && address && owner.toLowerCase().endsWith(address.slice(2).toLowerCase())) {
            // @ts-ignore
            const uri = await window.ethereum.request({
              method: 'eth_call',
              params: [{
                to: nftAddress,
                data: '0xc87b56dd' + i.toString(16).padStart(64, '0')
              }, 'latest']
            })
            let tokenURI = '';
            if (uri && typeof uri === 'string') {
              const hex = uri.startsWith('0x') ? uri.slice(2) : uri
              try {
                tokenURI = decodeURIComponent(hex.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('').replace(/\u0000+$/, ''));
              } catch (e) {
                tokenURI = '';
              }
            }
            items.push({ tokenId: i, tokenURI });
          }
        } catch (e) { /* 忽略错误 */ }
      }
      if (!cancelled) setNfts(items)
    }
    fetchNfts()
    return () => { cancelled = true }
  }, [address, nftAddress, balance])
  return nfts
}

export default function DashboardPage() {
  const { address } = useAccount();
  // 1. 成员天数
  const { data: memberSince } = useReadContract({
    address: CONTRACT_ADDRESSES.Governance,
    abi: ["function getMemberSince(address) view returns (uint256)"],
    functionName: "getMemberSince",
    args: [address],
    query: { enabled: !!address }
  });
  const memberDays = memberSince && Number(memberSince) > 0 ? Math.floor((Date.now() / 1000 - Number(memberSince)) / 86400) : 0;

  // 2. 资产概览/会员等级
  const { data: govBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.GovToken,
    abi: ["function balanceOf(address) view returns (uint256)"],
    functionName: "balanceOf",
    args: [address],
    query: { enabled: !!address }
  });
  const { data: rewardBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.RewardToken,
    abi: ["function balanceOf(address) view returns (uint256)"],
    functionName: "balanceOf",
    args: [address],
    query: { enabled: !!address }
  });
  const participationNft = useNftBalance(CONTRACT_ADDRESSES.ParticipationNFT);
  const statusNft = useNftBalance(CONTRACT_ADDRESSES.StatusNFT);
  const participationNfts = useUserNfts(CONTRACT_ADDRESSES.ParticipationNFT, participationNft.balance);
  const statusNfts = useUserNfts(CONTRACT_ADDRESSES.StatusNFT, statusNft.balance);

  // 3. 会员等级逻辑
  const gov = govBalance ? Number(formatEther(govBalance.toString())) : 0;
  console.log('govBalance', govBalance);
  console.log('gov', gov);
  console.log('GovToken address', CONTRACT_ADDRESSES.GovToken);
  let level = '普通会员', levelMax = 100, levelLabel = '青铜';
  if (gov >= 10000) { level = '钻石会员'; levelMax = 10000; levelLabel = '钻石'; }
  else if (gov >= 5000) { level = '铂金会员'; levelMax = 10000; levelLabel = '铂金'; }
  else if (gov >= 1000) { level = '金级会员'; levelMax = 5000; levelLabel = '金'; }
  else if (gov >= 500) { level = '银级会员'; levelMax = 1000; levelLabel = '银'; }
  else if (gov >= 100) { level = '青铜会员'; levelMax = 500; levelLabel = '青铜'; }
  const levelProgress = Math.min(100, Math.floor((gov / levelMax) * 100));

  // 4. 最近活动（链上事件）
  const [activities, setActivities] = useState<any[]>([]);
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.Governance,
    abi: [
      "event ProposalCreated(uint256 indexed proposalId, address proposer, string description)",
      "event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 weight)"
    ],
    eventName: "ProposalCreated",
    listener(log) {
      if (log[0]?.args?.proposer?.toLowerCase() === address?.toLowerCase()) {
        setActivities(prev => [{
          type: 'proposal',
          title: `创建提案 #${log[0].args.proposalId}`,
          description: log[0].args.description,
          timestamp: Date.now(),
          icon: Plus,
          color: 'success'
        }, ...prev]);
      }
    }
  });
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.Governance,
    abi: [
      "event ProposalCreated(uint256 indexed proposalId, address proposer, string description)",
      "event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 weight)"
    ],
    eventName: "VoteCast",
    listener(log) {
      if (log[0]?.args?.voter?.toLowerCase() === address?.toLowerCase()) {
        setActivities(prev => [{
          type: 'vote',
          title: `对提案 #${log[0].args.proposalId} 投票`,
          description: log[0].args.support ? '支持' : '反对',
          timestamp: Date.now(),
          icon: Vote,
          color: 'primary'
        }, ...prev]);
      }
    }
  });
  
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                欢迎回来! 🎉
              </h1>
              <p className="text-gray-300">
                你已经是DAO成员 {memberDays} 天了，继续参与治理获得更多奖励
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" glow>
                <Plus className="w-4 h-4 mr-2" />
                创建提案
              </Button>
              <Button variant="secondary">
                <Activity className="w-4 h-4 mr-2" />
                查看详情
              </Button>
            </div>
          </div>
        </div>

        {/* 资产概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <AssetCard key={index} stat={stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容区 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 最近活动 */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-primary" />
                  最近活动
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Button variant="ghost">
                    查看全部活动
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 成就展示 */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-accent" />
                  成就展示
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 我的NFT展柜模块 */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-secondary" />
                  我的NFT
                </CardTitle>
                <CardDescription>
                  展示您持有的参与NFT和身份NFT（最多显示6个）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {participationNfts.map(nft => (
                    <div key={nft.tokenId} className="bg-surface/30 p-4 rounded-lg flex flex-col items-center">
                      <div className="w-24 h-24 bg-gray-800 rounded mb-2 flex items-center justify-center overflow-hidden">
                        {nft.tokenURI ? <img src={nft.tokenURI} alt={`NFT #${nft.tokenId}`} className="object-cover w-full h-full" /> : <span className="text-gray-500">无图片</span>}
                      </div>
                      <div className="text-xs text-gray-400 mb-1">ParticipationNFT</div>
                      <div className="text-sm font-medium text-white">#{nft.tokenId}</div>
                    </div>
                  ))}
                  {statusNfts.map(nft => (
                    <div key={nft.tokenId} className="bg-surface/30 p-4 rounded-lg flex flex-col items-center">
                      <div className="w-24 h-24 bg-gray-800 rounded mb-2 flex items-center justify-center overflow-hidden">
                        {nft.tokenURI ? <img src={nft.tokenURI} alt={`NFT #${nft.tokenId}`} className="object-cover w-full h-full" /> : <span className="text-gray-500">无图片</span>}
                      </div>
                      <div className="text-xs text-gray-400 mb-1">StatusNFT</div>
                      <div className="text-sm font-medium text-white">#{nft.tokenId}</div>
                    </div>
                  ))}
                  {participationNfts.length === 0 && statusNfts.length === 0 && (
                    <div className="col-span-2 md:col-span-3 text-center text-gray-400">暂无NFT</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 个人统计 */}
            <Card variant="neon">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  个人统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-1">
                      {isNaN(gov) ? '--' : gov}
                    </div>
                    <div className="text-sm text-gray-400">总投票次数</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-white">{isNaN(gov) ? '--' : gov}</div>
                      <div className="text-xs text-gray-400">创建提案</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">{isNaN(gov) ? '--' : gov}</div>
                      <div className="text-xs text-gray-400">抽奖获胜</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">治理活跃度</span>
                      <span className="text-white">85%</span>
                    </div>
                    <Progress 
                      value={85} 
                      max={100}
                      variant="primary"
                      glow
                      animated
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-secondary" />
                  快捷操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {quickActions.map((action, index) => (
                    <QuickActionCard key={index} action={action} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 会员等级 */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-accent" />
                  会员等级
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent to-yellow-400 flex items-center justify-center mx-auto mb-3">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xl font-bold text-white mb-1">{level}</div>
                  <div className="text-sm text-gray-400">GOV: {isNaN(gov) ? '--' : gov} / {levelMax}</div>
                </div>
                
                <Progress 
                  value={levelProgress} 
                  max={100}
                  variant="accent"
                  glow
                  showLabel
                  label={`距离${levelLabel}级还需 ${levelMax - gov} GOV`}
                />
                
                <div className="mt-4 text-center">
                  <Button variant="accent" size="sm">
                    <Trophy className="w-4 h-4 mr-2" />
                    查看权益
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 