import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { sepolia } from 'wagmi/chains'

// 获取RPC URL，支持环境变量配置
const getRpcUrl = () => {
  // 使用Ankr提供的公共RPC端点，他们有良好的CORS支持
  return process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.ankr.com/eth_sepolia/ce968a1c8814cf234b410aca5f5e1bfbde61790d26026a67561a85310ce62232'
}

// 使用RainbowKit的默认配置
export const config = getDefaultConfig({
  appName: 'DAO Lottery',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '3f0b8959b34dea3610b96433c238d5e8',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(getRpcUrl(), {
        timeout: 15000,
        fetchOptions: {
          cache: 'no-store',
          credentials: 'omit',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          }
        },
        retryCount: 3,
        retryDelay: 1000,
      }),
  },
  ssr: false, // 禁用SSR，避免indexedDB错误
})

// 导出链信息供其他组件使用
export { sepolia } 