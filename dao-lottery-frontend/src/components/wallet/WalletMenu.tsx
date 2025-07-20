'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { useAppAccountModal } from '@/contexts/AccountModalContext'

export function WalletMenu() {
  const { address } = useAccount()
  const { openModal } = useAppAccountModal()

  if (!address) return null
  
  // 格式化地址显示
  const formattedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  
  return (
      <Button
        variant="ghost"
        className="border-primary/20 bg-surface/30 backdrop-blur-sm hover:bg-surface/50 hover:border-primary/40 hover:shadow-[0_0_12px_rgba(139,92,246,0.2)] transition-all duration-200 hover:scale-105"
      onClick={openModal}
      >
        {formattedAddress}
      </Button>
  )
} 