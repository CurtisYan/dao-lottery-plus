'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { useGovBalance } from '@/hooks/useGovBalance'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Wallet, Coins, Image as ImageIcon, Trophy, Clock, Loader2 } from 'lucide-react'

export function WalletOverview() {
  const { address, isConnected } = useAccount()
  const { balance: govBalance, isLoading: isGovLoading } = useGovBalance()
  
  // 此处可以添加获取其他代币和NFT余额的hooks
  // const { balance: rewardBalance, isLoading: isRewardLoading } = useRewardBalance()
  // const { nfts, isLoading: isNftsLoading } = useUserNFTs()
  
  if (!isConnected || !address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>钱包概览</CardTitle>
          <CardDescription>
            请连接您的钱包以查看详细信息
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <Wallet className="w-12 h-12 text-gray-500 mb-2" />
            <p className="text-gray-400">未连接钱包</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>钱包概览</CardTitle>
        <CardDescription>
          您当前的代币和NFT持有情况
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 地址信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mr-3">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-gray-400">钱包地址</div>
                <div className="text-base font-medium text-white">
                  {address.substring(0, 10)}...{address.substring(address.length - 8)}
                </div>
              </div>
            </div>
            <Badge className="bg-surface/50 text-white">Sepolia</Badge>
          </div>
          
          <hr className="border-t border-primary/10" />
          
          {/* GOV代币 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mr-3">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-gray-400">GOV代币余额</div>
                {isGovLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <div className="text-lg font-medium text-white flex items-center">
                    {govBalance.toString()}
                    <Badge variant="outline" className="ml-2 text-primary border-primary/30">
                      灵魂绑定
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <hr className="border-t border-primary/10" />
          
          {/* 参与信息 */}
          <div>
            <div className="text-sm font-medium text-gray-400 mb-3">参与数据</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface/30 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Trophy className="w-4 h-4 text-secondary mr-2" />
                  <span className="text-sm text-gray-300">抽奖参与</span>
                </div>
                <div className="text-lg font-medium text-white">已参与</div>
              </div>
              <div className="bg-surface/30 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 text-accent mr-2" />
                  <span className="text-sm text-gray-300">参与时长</span>
                </div>
                <div className="text-lg font-medium text-white">刚加入</div>
              </div>
              <div className="bg-surface/30 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <ImageIcon className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm text-gray-300">NFT持有</span>
                </div>
                <div className="text-lg font-medium text-white">0</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 