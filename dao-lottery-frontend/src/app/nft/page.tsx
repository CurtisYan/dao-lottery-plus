import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  Image, 
  Star, 
  Crown, 
  Trophy,
  Gift,
  Filter,
  Grid,
  List,
  Search,
  Sparkles,
  Award,
  Target,
  Users,
  Coins,
  TrendingUp,
  Eye,
  ExternalLink
} from 'lucide-react'

// 删除mockNFTs相关内容
// 删除mockNFTs、tiers、stats等模拟数据定义
// 删除NFTCard、TierProgress等依赖mockNFTs的组件实现
// 页面主导出函数内如有mockNFTs相关渲染一并删除

export default function NFTPage() {
  // 删除mockNFTs相关变量
  // const ownedNFTs = mockNFTs.filter(nft => nft.owned)
  // const availableNFTs = mockNFTs.filter(nft => !nft.owned)

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            <Image className="w-8 h-8 inline-block mr-3 text-primary" />
            NFT 收藏
          </h1>
          <p className="text-gray-300">收集独特的NFT，展示你在DAO中的成就</p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 删除stats相关内容 */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* NFT展示区域 */}
          <div className="lg:col-span-2">
            {/* 筛选和操作栏 */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex gap-3">
                <Button variant="primary">全部</Button>
                <Button variant="ghost">已拥有</Button>
                <Button variant="ghost">参与NFT</Button>
                <Button variant="ghost">身份NFT</Button>
              </div>
              
              <div className="flex gap-3">
                <Button variant="secondary" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  筛选
                </Button>
                <Button variant="ghost" size="sm">
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 已拥有的NFT */}
            {/* 删除ownedNFTs相关内容 */}
            {/* 可获得的NFT */}
            {/* 删除availableNFTs相关内容 */}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 等级进度 */}
            {/* 删除TierProgress相关内容 */}

            {/* 获取指南 */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Gift className="w-6 h-6 text-accent" />
                  获取指南
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-primary font-bold">1</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">参与治理</div>
                      <div className="text-sm text-gray-400">投票参与提案即可获得参与NFT</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-secondary font-bold">2</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">持有GOV</div>
                      <div className="text-sm text-gray-400">达到指定数量即可领取身份NFT</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-accent font-bold">3</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">赢得抽奖</div>
                      <div className="text-sm text-gray-400">获得抽奖大奖可得到特殊NFT</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 