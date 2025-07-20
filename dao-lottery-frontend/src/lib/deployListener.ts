'use client'

import { PublicClient, parseAbi } from 'viem';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { updateContractAddresses } from './contracts';

// 硬编码的Sepolia测试网合约地址
const DEFAULT_ADDRESSES = {
  GovToken: "0x5a08cfc2e2e4b61b0ad4bf9d8977f5fc4c74d0ad",
  RewardToken: "0x65d4bc4e05836e4421c985dc2947f1d68ccaea48",
  ParticipationNFT: "0x8a544f1e3954296d8ba6430e2c6cb505be85d836",
  Governance: "0x1a6e113cf3abd20650662f76bc163ac2d43a9347",
  Lottery: "0xdb7d60eca9dff432d8a8cc3087fe278e5bfd0d0c",
  StatusNFT: "0x86285162f7060796aebecd9c0809e28c0d15e2a5",
};

// 部署事件监听器ABI
const deployEventAbi = parseAbi([
  'event ContractDeployed(string name, address contractAddress, uint256 timestamp)',
]);

/**
 * 监听新的合约部署事件
 */
export function useDeploymentListener() {
  useEffect(() => {
    // 监听本地存储的变化以检测新部署
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('contract_') && e.newValue) {
        const contractName = e.key.replace('contract_', '');
        toast.info(`检测到新的合约部署: ${contractName}`, {
          description: `地址: ${e.newValue.slice(0, 10)}...${e.newValue.slice(-8)}`,
          duration: 5000,
        });
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
}

/**
 * 从区块链获取最近部署的合约
 * @param publicClient - Viem 公共客户端
 * @returns 最近部署的合约地址
 */
export async function getRecentDeployments(publicClient: PublicClient): Promise<Record<string, string>> {
  try {
    console.log('尝试从区块链获取最近部署的合约...');
    
    // 获取最近的区块
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`当前区块高度: ${blockNumber}`);
    
    // 首先尝试从硬编码地址获取合约
    console.log('使用硬编码的Sepolia合约地址');
    
    // 返回硬编码地址作为最近部署
    console.log('使用硬编码的Sepolia合约地址:', DEFAULT_ADDRESSES);
    return { ...DEFAULT_ADDRESSES };
  } catch (error) {
    console.error('获取最近部署失败:', error);
    return {};
  }
} 