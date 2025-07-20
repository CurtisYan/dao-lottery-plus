'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { useGovBalance } from '@/hooks/useGovBalance'
import { useRewardTokenBalance } from '@/hooks/useTokenBalance'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Wallet, Users, Loader2 } from 'lucide-react'
import { useState } from 'react'

function formatShort(num: string) {
  if (!num) return '0'
  const n = Number(num)
  if (!isNaN(n)) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K'
    // 限制最大显示长度，但确保代币符号完整显示
    const formatted = n.toLocaleString(undefined, { maximumFractionDigits: 4 })
    return formatted
  }
  return num
}

export function UserProfile() {
  const { address, isConnected } = useAccount()
  const { balance: govBalance, isLoading: govLoading } = useGovBalance()
  const { balance: rewardBalance, isLoading: rewardLoading } = useRewardTokenBalance()
  
  // 可扩展更多代币
  const tokens = [
    { symbol: 'GOV', balance: govBalance, isLoading: govLoading },
    { symbol: 'RWD', balance: rewardBalance, isLoading: rewardLoading } // 改为 RWD
    // 可继续添加更多代币
  ]
  // 只显示前2个，剩余用+N表示
  const visibleTokens = tokens.slice(0, 2)
  const hiddenCount = tokens.length - visibleTokens.length
  
  if (!isConnected || !address) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                <Wallet className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">未连接钱包</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="overflow-hidden border-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mr-3">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                {visibleTokens.map((t, i) => (
                  <Badge 
                    key={t.symbol}
                    variant="outline" 
                    className="text-primary cursor-pointer hover:bg-primary/10 transition-all duration-200 border-primary/10"
                    title={`${t.balance} ${t.symbol}`}
                  >
                    {t.isLoading ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t.symbol === 'RWD' ? '获取中...' : '加载中...'}
                      </span>
                    ) : (
                      `${formatShort(String(t.balance))} ${t.symbol}`
                    )}
                  </Badge>
                ))}
                {hiddenCount > 0 && (
                  <span className="ml-1 cursor-pointer text-primary">
                    +{hiddenCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 