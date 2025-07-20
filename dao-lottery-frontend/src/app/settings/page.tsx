'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { CONTRACT_ADDRESSES, updateContractAddresses, getAllContractAddresses } from '@/lib/contracts'
import { toast } from 'sonner'
import { usePublicClient } from 'wagmi'
import { sepolia } from '@/lib/wagmi'
import { getRecentDeployments } from '@/lib/deployListener'
import { useRouter } from 'next/navigation'
import { Shield, AlertCircle, Server, ChevronDown } from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import { Badge } from '@/components/ui/Badge'
import { useWriteContract, useConfig } from 'wagmi'
import { ABIS } from '@/lib/contracts'
import { parseEther } from 'viem'
import { useChainModal } from '@rainbow-me/rainbowkit'

export default function SettingsPage() {
  const { address } = useAccount()
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const [addresses, setAddresses] = useState({
    GovToken: '',
    RewardToken: '',
    ParticipationNFT: '',
    Governance: '',
    Lottery: '',
    StatusNFT: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const publicClient = usePublicClient({ chainId: sepolia.id })
  // 新增 state
  const [rewardAddress, setRewardAddress] = useState('')
  const [rewardType, setRewardType] = useState('gov')
  const [rewardAmount, setRewardAmount] = useState('')
  const [isRewarding, setIsRewarding] = useState(false)
  const { writeContractAsync } = useWriteContract()
  const config = useConfig()
  const { openChainModal } = useChainModal()

  // 非管理员账户重定向到首页
  useEffect(() => {
    if (address && !isAdmin) {
      toast.error('您没有权限访问此页面')
      router.push('/')
    }
  }, [address, isAdmin, router])

  // 加载当前合约地址
  useEffect(() => {
    // 使用客户端专用函数获取合约地址
    const clientAddresses = getAllContractAddresses()
    setAddresses(clientAddresses)
  }, [])
  
  // 如果未连接钱包或非管理员，显示无权限页面
  if (!address || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">访问受限</h1>
          <p className="text-gray-400 mb-8">
            只有管理员账户可以访问系统设置页面。请使用管理员钱包连接。
          </p>
          <Button onClick={() => router.push('/')}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  // 自动检测合约地址
  const detectContractAddresses = async () => {
    if (!publicClient) {
      toast.error('区块链客户端未初始化')
      return
    }

    setIsLoading(true)
    try {
      toast.info('正在检测合约地址...')
      
      // 从区块链获取最近部署的合约
      const recentDeployments = await getRecentDeployments(publicClient)
      
      if (Object.keys(recentDeployments).length === 0) {
        toast.warning('未检测到最近部署的合约')
        return
      }
      
      // 更新检测到的地址
      const newAddresses = { ...addresses }
      let foundContracts = 0
      
      Object.entries(recentDeployments).forEach(([name, address]) => {
        // 将合约名称转换为我们期望的格式
        const contractKey = name.replace(/Contract$/, '') as keyof typeof addresses
        if (contractKey in addresses) {
          newAddresses[contractKey] = address as string
          foundContracts++
        }
      })
      
      if (foundContracts > 0) {
        setAddresses(newAddresses)
        toast.success(`成功检测到 ${foundContracts} 个合约地址`)
      } else {
        toast.warning('未找到匹配的合约地址')
      }
    } catch (error) {
      console.error('检测合约地址失败:', error)
      toast.error('检测合约地址失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 保存合约地址
  const saveAddresses = () => {
    // 验证地址格式
    const invalidAddresses = Object.entries(addresses).filter(
      ([key, value]) => value && !value.match(/^0x[a-fA-F0-9]{40}$/)
    )
    
    if (invalidAddresses.length > 0) {
      toast.error(`以下合约地址格式无效: ${invalidAddresses.map(([key]) => key).join(', ')}`)
      return
    }
    
    try {
      updateContractAddresses(addresses)
      toast.success('合约地址已更新，页面将刷新')
    } catch (error) {
      console.error('保存合约地址失败:', error)
      toast.error('保存合约地址失败')
    }
  }

  // 重置为默认地址
  const resetAddresses = () => {
    if (window.confirm('确定要重置所有合约地址吗？')) {
      // 清除本地存储中的地址
      Object.keys(addresses).forEach(key => {
        localStorage.removeItem(`contract_${key.toUpperCase()}`)
      })
      
      // 刷新页面以应用默认地址
      window.location.reload()
    }
  }

  // 验证合约地址
  const validateAddresses = async () => {
    if (!publicClient) {
      toast.error('区块链客户端未初始化')
      return
    }

    setIsLoading(true)
    try {
      toast.info('正在验证合约地址...')
      
      const results = []
      
      // 检查每个合约地址是否有代码
      for (const [name, address] of Object.entries(addresses)) {
        if (!address || address === '0x0000000000000000000000000000000000000000') {
          results.push({ name, valid: false, reason: '地址为空或零地址' })
          continue
        }
        
        try {
          const code = await publicClient.getBytecode({ address: address as `0x${string}` })
          if (!code || code === '0x') {
            results.push({ name, valid: false, reason: '地址没有部署合约代码' })
          } else {
            results.push({ name, valid: true })
          }
        } catch (error) {
          results.push({ name, valid: false, reason: '验证失败' })
        }
      }
      
      // 显示验证结果
      const validCount = results.filter(r => r.valid).length
      const invalidCount = results.length - validCount
      
      if (invalidCount === 0) {
        toast.success('所有合约地址验证通过')
      } else {
        const invalidList = results
          .filter(r => !r.valid)
          .map(r => `${r.name}: ${r.reason}`)
          .join('\n')
        
        toast.error(`${invalidCount} 个合约地址无效: ` + invalidList)
      }
    } catch (error) {
      console.error('验证合约地址失败:', error)
      toast.error('验证合约地址失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 管理员发放奖励逻辑
  const handleAdminReward = async () => {
    if (!rewardAddress || !rewardAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('请输入有效的钱包地址')
      return
    }
    if ((rewardType === 'gov' || rewardType === 'reward') && (!rewardAmount || isNaN(Number(rewardAmount)) || Number(rewardAmount) <= 0)) {
      toast.error('请输入有效的数量')
      return
    }
    setIsRewarding(true)
    try {
      let txHash
      if (rewardType === 'gov') {
        txHash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.GovToken,
          abi: [
            {
              "inputs": [
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" }
              ],
              "name": "mint",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'mint',
          args: [rewardAddress as `0x${string}`, parseEther(rewardAmount)],
          chainId: sepolia.id
        })
      } else if (rewardType === 'reward') {
        txHash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.RewardToken,
          abi: [
            {
              "inputs": [
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" }
              ],
              "name": "mint",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'mint',
          args: [rewardAddress as `0x${string}`, parseEther(rewardAmount)],
          chainId: sepolia.id
        })
      } else if (rewardType === 'nft') {
        txHash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ParticipationNFT,
          abi: [
            {
              "inputs": [
                { "internalType": "address", "name": "to", "type": "address" }
              ],
              "name": "safeMint",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'safeMint',
          args: [rewardAddress as `0x${string}`],
          chainId: sepolia.id
        })
      }
      toast.success('奖励发放成功，交易已提交！')
      setRewardAddress('')
      setRewardAmount('')
    } catch (err) {
      toast.error('发放失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setIsRewarding(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">系统设置</h1>
        <Badge variant="outline" className="bg-surface/30 border-primary/30 text-primary flex items-center">
          <Shield className="w-3 h-3 mr-1" />
          管理员模式
        </Badge>
      </div>
      
      <div className="mb-6 p-4 rounded-lg bg-surface/30 border border-primary/20 flex items-center justify-between">
        <div className="flex items-center">
        <Server className="w-5 h-5 text-primary mr-3" />
        <div>
          <div className="font-medium">Sepolia测试网</div>
          <div className="text-sm text-gray-400">当前连接到以太坊Sepolia测试网络</div>
        </div>
        </div>
        <Button
          onClick={openChainModal}
          variant="secondary"
          size="sm"
        >
          切换网络
          <ChevronDown className="w-3 h-3 ml-2" />
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>合约地址配置</CardTitle>
          <CardDescription>
            配置系统使用的智能合约地址。这些地址在部署合约后自动生成，通常不需要手动修改。
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {Object.entries(addresses).map(([key, value]) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <Label htmlFor={key} className="md:col-span-1">{key}</Label>
              <div className="md:col-span-3">
                <Input
                  id={key}
                  value={value}
                  onChange={(e) => setAddresses(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`${key} 合约地址`}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-3 justify-between">
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveAddresses} variant="primary">保存设置</Button>
            <Button onClick={resetAddresses} variant="ghost">重置为默认</Button>
            <Button onClick={validateAddresses} variant="secondary" disabled={isLoading}>
              验证地址
            </Button>
          </div>
          <Button 
            onClick={detectContractAddresses} 
            variant="secondary" 
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '自动检测合约地址'}
          </Button>
        </CardFooter>
      </Card>

      {/* 管理员发放奖励功能 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>手动发放奖励</CardTitle>
          <CardDescription>
            管理员可手动发放 GOV 代币、奖励代币或 NFT 给指定用户。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Label htmlFor="rewardAddress" className="md:col-span-1">接收地址</Label>
            <div className="md:col-span-3">
              <Input
                id="rewardAddress"
                value={rewardAddress}
                onChange={e => setRewardAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Label htmlFor="rewardType" className="md:col-span-1">奖励类型</Label>
            <div className="md:col-span-3">
              <select
                id="rewardType"
                value={rewardType}
                onChange={e => setRewardType(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="gov">GOV 代币</option>
                <option value="reward">奖励代币</option>
                <option value="nft">参与 NFT</option>
              </select>
            </div>
          </div>
          {(rewardType === 'gov' || rewardType === 'reward') && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <Label htmlFor="rewardAmount" className="md:col-span-1">数量</Label>
              <div className="md:col-span-3">
                <Input
                  id="rewardAmount"
                  type="number"
                  min={1}
                  value={rewardAmount}
                  onChange={e => setRewardAmount(e.target.value)}
                  placeholder="请输入数量"
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleAdminReward} disabled={isRewarding}>
            {isRewarding ? '发放中...' : '发放奖励'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 