'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { WalletMenu } from '@/components/wallet/WalletMenu'
import { Button } from '@/components/ui/Button'
import { UserProfile } from '@/components/UserProfile'
import { useAccount } from 'wagmi'
import { cn } from '@/lib/utils'
import { 
  Menu, 
  X, 
  Vote, 
  Zap, 
  Image, 
  BarChart3, 
  Home,
  Sparkles,
  Settings,
  User
} from 'lucide-react'

const navigation = [
  { name: '首页', href: '/', icon: Home },
  { name: '治理', href: '/governance', icon: Vote },
  { name: '抽奖', href: '/lottery', icon: Zap },
  { name: 'RWD', href: '/reward', icon: Zap },
  { name: 'NFT', href: '/nft', icon: Image },
  { name: '仪表板', href: '/dashboard', icon: BarChart3 },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isConnected } = useAccount()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center group-hover:animate-glow transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white hidden sm:block">
              DAO Lottery<span className="text-primary">+</span>
            </span>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "text-primary bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                      : "text-gray-400 hover:text-white hover:bg-surface/30"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* 右侧操作区 */}
          <div className="flex items-center space-x-4">
            {/* 桌面视图显示用户资料 */}
            <div className="hidden md:block">
              <UserProfile />
            </div>
            
            {/* 如果已连接显示钱包菜单，否则显示连接按钮 */}
            {isConnected ? <WalletMenu /> : <ConnectButton />}
            
            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 移动端导航菜单 */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-primary/20 bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            {/* 移动端用户资料 */}
            <div className="mb-4">
              <UserProfile />
            </div>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full",
                      isActive
                        ? "text-primary bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                        : "text-gray-400 hover:text-white hover:bg-surface/30"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
} 