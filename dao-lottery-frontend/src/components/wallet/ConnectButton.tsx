'use client'

import React from 'react'
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/Button'
import { Zap, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppAccountModal } from '@/contexts/AccountModalContext'

export function ConnectButton() {
  const { openModal } = useAppAccountModal();
  const router = useRouter();
  
  // 定义一个明确的跳转函数
  const handleNavigateToLottery = (e) => {
    e.preventDefault(); // 防止事件冒泡
    e.stopPropagation();
    console.log('正在跳转到抽奖页面...');
    router.push('/lottery');
  };

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated')

              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="primary"
                    glow
                    className="font-semibold"
                  >
              <Wallet className="w-4 h-4 mr-2" />
                    连接钱包
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button
              onClick={openConnectModal}
                    variant="danger"
                    className="font-semibold"
                  >
                    错误网络
                  </Button>
                )
              }

              return (
                  <Button
            onClick={handleNavigateToLottery}
            variant="primary"
            glow
            className="font-semibold"
          >
            <Zap className="w-4 h-4 mr-2" />
            参与抽奖
                </Button>
        )
      }}
    </RainbowConnectButton.Custom>
  )
} 