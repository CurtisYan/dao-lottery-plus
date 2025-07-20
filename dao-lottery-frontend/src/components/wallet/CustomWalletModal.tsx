'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { Copy, LogOut, Settings, X } from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import { useAppAccountModal } from '@/contexts/AccountModalContext'

export function CustomWalletModal() {
  const { address } = useAccount()
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const { disconnect } = useDisconnect()
  const { closeModal, isModalOpen } = useAppAccountModal()
  const { data: balance } = useBalance({ address })

  if (!isModalOpen || !address) {
    return null
  }

  const formattedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  const ethBalance = balance ? parseFloat(balance.formatted).toFixed(4) : '0.000'

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    // You can add a toast notification here
  }

  const handleDisconnect = () => {
    disconnect()
    closeModal()
  }

  const goToSettings = () => {
    router.push('/settings')
    closeModal()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={closeModal}
    >
      <div 
        className="relative p-6 bg-[#1e1e1e] rounded-2xl border border-gray-700 shadow-lg max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center space-y-4 pt-4">
          <div className="w-16 h-16 rounded-full bg-[#ffdd59] flex items-center justify-center">
            <img 
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${address}&backgroundColor=ffdd59,b6e3f4,c0aede,d1d4f9`} 
              alt="Wallet Avatar" 
              className="w-12 h-12" 
            />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">{formattedAddress}</h3>
            <p className="text-gray-400 text-sm">{ethBalance} ETH</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <Button 
              variant="ghost" 
              className="flex items-center justify-center gap-2 py-5 bg-gray-700/50 hover:bg-gray-600/50"
              onClick={copyAddress}
            >
              <Copy className="w-5 h-5" />
              复制地址
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center justify-center gap-2 py-5 bg-gray-700/50 hover:bg-gray-600/50"
              onClick={handleDisconnect}
            >
              <LogOut className="w-5 h-5" />
              断开连接
            </Button>
            
            {isAdmin && (
              <Button 
                variant="ghost" 
                className="col-span-2 flex items-center justify-center gap-2 py-5 bg-gray-700/50 hover:bg-gray-600/50"
                onClick={goToSettings}
              >
                <Settings className="w-5 h-5" />
                系统设置
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 