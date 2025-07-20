import React from 'react'

export const LoadingState = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
    <div className="w-16 h-16 mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    <div className="text-primary text-xl font-bold">Loading Web3 Providers...</div>
    <p className="text-gray-400 mt-2">连接到区块链网络中，请稍候...</p>
  </div>
) 