// 智能合约地址配置
import { http } from "wagmi";
import { sepolia } from "./wagmi";

// 硬编码的Sepolia测试网合约地址
const SEPOLIA_CONTRACT_ADDRESSES = {
  GovToken: "0x5a08cfc2e2e4b61b0ad4bf9d8977f5fc4c74d0ad",
  RewardToken: "0x65d4bc4e05836e4421c985dc2947f1d68ccaea48",
  ParticipationNFT: "0x8a544f1e3954296d8ba6430e2c6cb505be85d836",
  Governance: "0x1a6e113cf3abd20650662f76bc163ac2d43a9347",
  Lottery: "0xdb7d60eca9dff432d8a8cc3087fe278e5bfd0d0c",
  StatusNFT: "0x86285162f7060796aebecd9c0809e28c0d15e2a5",
};

// 从环境变量或硬编码值获取合约地址
const getEnvAddress = (key: string): `0x${string}` => {
  // 获取合约名称 (去除NEXT_PUBLIC_前缀和_ADDRESS后缀)
  const contractName = key.replace('NEXT_PUBLIC_', '').replace('_ADDRESS', '') as keyof typeof SEPOLIA_CONTRACT_ADDRESSES;

  // 1. 优先从localStorage获取（如果在浏览器环境）
  if (typeof window !== "undefined") {
    const localAddress = localStorage.getItem(`contract_${contractName}`);
    if (localAddress && localAddress.startsWith("0x") && localAddress.length === 42) {
      console.log(`使用本地存储的${contractName}地址:`, localAddress);
      return localAddress as `0x${string}`;
    }
  }
  
  // 2. 其次从环境变量获取
  const envAddress = process.env[key];
  if (envAddress && envAddress.startsWith("0x") && envAddress.length === 42) {
    console.log(`使用环境变量的${contractName}地址:`, envAddress);
    return envAddress as `0x${string}`;
  }
  
  // 3. 最后使用硬编码的地址
  const hardcodedAddress = SEPOLIA_CONTRACT_ADDRESSES[contractName];
  if (hardcodedAddress) {
    console.log(`使用硬编码的${contractName}地址:`, hardcodedAddress);
    return hardcodedAddress as `0x${string}`;
  }
  
  // 4. 如果以上都不可用，返回零地址
  console.warn(`警告: ${contractName}地址未找到，使用零地址`);
    return "0x0000000000000000000000000000000000000000" as `0x${string}`;
};

// 缓存合约地址
let _contractAddresses: {
  GovToken: `0x${string}`;
  RewardToken: `0x${string}`;
  ParticipationNFT: `0x${string}`;
  Governance: `0x${string}`;
  Lottery: `0x${string}`;
  StatusNFT: `0x${string}`;
} | null = null;

// 获取所有合约地址
export const getAllContractAddresses = () => {
  if (!_contractAddresses) {
    _contractAddresses = {
      GovToken: getEnvAddress("NEXT_PUBLIC_GOVTOKEN_ADDRESS"),
      RewardToken: getEnvAddress("NEXT_PUBLIC_REWARDTOKEN_ADDRESS"),
      ParticipationNFT: getEnvAddress("NEXT_PUBLIC_PARTICIPATIONNFT_ADDRESS"),
      Governance: getEnvAddress("NEXT_PUBLIC_GOVERNANCE_ADDRESS"),
      Lottery: getEnvAddress("NEXT_PUBLIC_LOTTERY_ADDRESS"),
      StatusNFT: getEnvAddress("NEXT_PUBLIC_STATUSNFT_ADDRESS"),
    };
  }
  return { ..._contractAddresses };
};

// 合约地址代理对象
export const CONTRACT_ADDRESSES = new Proxy(
  {} as {
    GovToken: `0x${string}`;
    RewardToken: `0x${string}`;
    ParticipationNFT: `0x${string}`;
    Governance: `0x${string}`;
    Lottery: `0x${string}`;
    StatusNFT: `0x${string}`;
  },
  {
    get(target, prop) {
      if (!_contractAddresses) {
        _contractAddresses = {
          GovToken: getEnvAddress("NEXT_PUBLIC_GOVTOKEN_ADDRESS"),
          RewardToken: getEnvAddress("NEXT_PUBLIC_REWARDTOKEN_ADDRESS"),
          ParticipationNFT: getEnvAddress("NEXT_PUBLIC_PARTICIPATIONNFT_ADDRESS"),
          Governance: getEnvAddress("NEXT_PUBLIC_GOVERNANCE_ADDRESS"),
          Lottery: getEnvAddress("NEXT_PUBLIC_LOTTERY_ADDRESS"),
          StatusNFT: getEnvAddress("NEXT_PUBLIC_STATUSNFT_ADDRESS"),
        };
      }
      return _contractAddresses[prop as keyof typeof _contractAddresses];
    },
  }
);

// 保存合约地址到本地存储
export const saveContractAddress = (key: string, address: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`contract_${key}`, address);
  }
};

// 更新所有合约地址
export const updateContractAddresses = (addresses: {
  GovToken?: string;
  RewardToken?: string;
  ParticipationNFT?: string;
  Governance?: string;
  Lottery?: string;
  StatusNFT?: string;
}) => {
  Object.entries(addresses).forEach(([key, value]) => {
    if (value && value.startsWith("0x")) {
      saveContractAddress(key.toUpperCase(), value);
    }
  });

  // 清除缓存，强制重新计算
  _contractAddresses = null;

  // 重新加载页面应用新地址
  if (typeof window !== "undefined") {
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
};

// 基础ERC20 ABI
export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// 基础ERC721 ABI
export const ERC721_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// 简化的ABI定义（注意：必须在 ERC20_ABI 和 ERC721_ABI 定义之后）
export const ABIS = {
  GovToken: ERC20_ABI,
  RewardToken: ERC20_ABI,
  ParticipationNFT: ERC721_ABI,
  StatusNFT: ERC721_ABI,
  Governance: [
    "function createProposal(string _desc, uint _duration) external",
    "function voteProposal(uint8 _proposalId, bool _choice) external",
    "function finalizeProposal(uint8 _proposalId) external",
    "function getProposal(uint8 _proposalId) external view returns (tuple)",
    "function getProposalCount() external view returns (uint8)",
    "function getEligibleForLottery(uint8 _proposalId) external view returns (address[])",
    "function getProposalFinlized(uint8 _proposalId) external view returns (bool)",
    "function hasUserVoted(uint8 _proposalId, address _user) external view returns (bool)",
    "function getVoteChoice(uint8 _proposalId, address _user) external view returns (bool)",
    "function getTotalVotes() external view returns (uint)",
    "function getMemberSince(address user) external view returns (uint256)",
    "function setAdmin(address _addr, bool _isAdmin) external",
    "function setFEE(uint _fee) external",
    "function setTHRESHOLD(uint _threshold) external",
    "function setLotteryContract(address _lottery) external",
    "function rewardVoter(address _voter, uint8 _amount) external",
    "event create(address indexed proposer, uint8 indexed proposalId)",
    "event vote(address indexed voter, uint8 indexed proposalId, bool indexed choice)",
    "event finalize(uint8 indexed proposalId, bool indexed result)",
    "event execute(uint8 indexed proposalId)",
    "event claimGOV(address indexed winner, uint8 indexed proposalId)",
  ],
  Lottery: [
    "function rewardAmount() view returns (uint256)",
    "function getPoolAmount(uint8 _proposalId) view returns (uint256)",
    "function drawWinner(uint8 _proposalId) returns (address)",
    "function claimReward(uint8 _proposalId) nonpayable",
    "function getWinner(uint8 _proposalId) view returns (address)",
    "function getClaimed(uint8 _proposalId) view returns (bool)",
    "event WinnerDrawn(uint8 indexed proposalId, address indexed winner)",
  ],
} as const;

// 类型定义
export type ContractName = keyof typeof CONTRACT_ADDRESSES;
export type ContractAddress = (typeof CONTRACT_ADDRESSES)[ContractName];

// NFT配置
export const NFT_CONFIG = {
  ParticipationNFT: {
    baseURI: process.env.NEXT_PUBLIC_PARTICIPATION_BASE_URI || "https://ipfs.io/ipfs/QmYourParticipationNFTMetadata/",
    name: "DAO Participation NFT",
    symbol: "DPNFT",
  },
  StatusNFT: {
    baseURI: process.env.NEXT_PUBLIC_STATUS_NFT_BASE_URI || "https://ipfs.io/ipfs/QmYourStatusNFTMetadata/",
    name: "DAO Status NFT",
    symbol: "DSNFT",
    tiers: [
      { threshold: 100, name: "Bronze Member", color: "#CD7F32" },
      { threshold: 500, name: "Silver Member", color: "#C0C0C0" },
      { threshold: 1000, name: "Gold Member", color: "#FFD700" },
      { threshold: 5000, name: "Platinum Member", color: "#E5E4E2" },
      { threshold: 10000, name: "Diamond Member", color: "#B9F2FF" },
    ],
  },
} as const;
