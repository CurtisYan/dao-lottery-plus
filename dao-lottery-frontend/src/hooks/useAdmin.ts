'use client'

import { useMemo } from 'react'
import { useAccount } from 'wagmi'

// 管理员地址
const ADMIN_ADDRESS = '0xD80B0AbD71EA4AE4186dD50329Fe075D5b2873d6'.toLowerCase()

/**
 * 检查当前连接的钱包是否为管理员
 * @returns 当前用户是否为管理员
 */
export function useAdmin(): { isAdmin: boolean } {
  const { address } = useAccount()
  
  const isAdmin = useMemo(() => {
    if (!address) return false
    return address.toLowerCase() === ADMIN_ADDRESS
  }, [address])
  
  return { isAdmin }
} 