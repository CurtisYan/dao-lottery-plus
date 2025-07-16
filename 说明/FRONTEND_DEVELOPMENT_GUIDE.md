# DAO Lottery 前端开发完整指南

## 🎨 设计主题：Neon Cyberpunk

### 设计语言规范
```css
/* 核心颜色 */
--primary: #8B5CF6 (紫色)
--secondary: #06B6D4 (青色) 
--accent: #EC4899 (粉色)
--background: #0F0F23 (深蓝黑)
--surface: #1A1B3A (深紫灰)
--glass: rgba(139, 92, 246, 0.1)

/* 效果 */
- 霓虹光晕: box-shadow + filter: blur
- 玻璃态: backdrop-filter: blur(12px)
- 渐变边框: border-image-source
- 动态发光: animation keyframes
```

### 视觉参考
- **整体风格**: Cyberpunk 2077 UI + Apple Vision Pro
- **卡片设计**: 半透明玻璃 + 霓虹边框
- **按钮**: 发光效果 + hover动画
- **图表**: 霓虹色数据可视化

---

## 📋 开发步骤指南

### 步骤1: 项目初始化 (15分钟)

```bash
# 创建Next.js项目
npx create-next-app@latest dao-lottery-frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd dao-lottery-frontend

# 安装核心依赖
npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
npm install lucide-react framer-motion class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-progress

# 开发依赖
npm install -D @types/node
```

**AI提示词**: 
> 创建一个Web3 DApp项目，使用Next.js + TypeScript + TailwindCSS。按照上述命令安装所有依赖。确保项目结构清晰，所有包都正确安装。

---

### 步骤2: 基础配置 (20分钟)

#### 2.1 TailwindCSS配置
```javascript
// tailwind.config.js - Cyberpunk主题
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#8B5CF6",
        secondary: "#06B6D4", 
        accent: "#EC4899",
        background: "#0F0F23",
        surface: "#1A1B3A",
        glass: "rgba(139, 92, 246, 0.1)"
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    }
  }
}
```

#### 2.2 Web3配置
```typescript
// src/lib/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { hardhat, localhost } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'DAO Lottery',
  projectId: 'YOUR_PROJECT_ID',
  chains: [hardhat, localhost],
  ssr: false
})
```

#### 2.3 合约配置
```typescript
// src/lib/contracts.ts
export const CONTRACTS = {
  GovToken: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  RewardToken: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
  ParticipationNFT: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
  Governance: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
  Lottery: "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9",
  StatusNFT: "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707"
}
```

**AI提示词**:
> 配置TailwindCSS使用Cyberpunk霓虹主题，包含暗色背景、紫色/青色/粉色主色调。添加glow和float动画。配置wagmi用于Web3连接，支持本地hardhat网络。创建合约地址配置文件。

---

### 步骤3: 核心组件库 (45分钟)

#### 3.1 基础UI组件
创建以下组件，每个都要有Cyberpunk风格：

```typescript
// src/components/ui/Button.tsx - 霓虹发光按钮
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  children: React.ReactNode
  onClick?: () => void
}

// src/components/ui/Card.tsx - 玻璃态卡片
interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  hover?: boolean
}

// src/components/ui/Input.tsx - 霓虹边框输入框
// src/components/ui/Badge.tsx - 发光徽章
// src/components/ui/Progress.tsx - 霓虹进度条
```

#### 3.2 Web3组件
```typescript
// src/components/wallet/ConnectButton.tsx - 钱包连接
// src/components/wallet/WalletInfo.tsx - 用户信息显示
// src/components/layout/Navigation.tsx - 导航栏
```

**AI提示词**:
> 创建Cyberpunk风格的UI组件库。每个组件要有：1)玻璃态透明效果 2)霓虹色边框 3)hover发光动画 4)TypeScript类型定义。参考Cyberpunk 2077的UI设计，使用backdrop-filter和box-shadow创建霓虹效果。所有组件要支持variant属性和可选的glow效果。

---

### 步骤4: 页面布局 (30分钟)

#### 4.1 主布局
```typescript
// src/app/layout.tsx - 全局布局
// 包含：RainbowKit Provider, React Query, 主题配置

// src/components/layout/Header.tsx - 顶部导航
// 包含：Logo, 导航菜单, 钱包连接按钮

// src/components/layout/Sidebar.tsx - 侧边栏 (可选)
// 包含：快捷导航, 用户状态, 通知

// src/components/layout/Footer.tsx - 底部
// 包含：项目信息, 社交链接
```

#### 4.2 响应式设计
- **移动端** (< 768px)：单列布局，抽屉式导航
- **平板端** (768px - 1024px)：双列布局
- **桌面端** (> 1024px)：三列布局，固定侧边栏

**AI提示词**:
> 创建响应式布局组件，使用Cyberpunk主题。包含顶部导航栏（带钱包连接）、主内容区域、可选侧边栏。所有组件要有玻璃态效果和霓虹边框。确保移动端友好，使用抽屉式导航。布局要有科技感和层次感。

---

### 步骤5: 治理功能页面 (60分钟)

#### 5.1 治理首页
```typescript
// src/app/governance/page.tsx
功能模块：
- 提案列表展示 (分页)
- 投票统计图表
- 用户GOV余额显示
- 创建提案按钮
- 筛选和排序功能
```

#### 5.2 治理组件
```typescript
// src/components/governance/ProposalCard.tsx - 提案卡片
interface ProposalCardProps {
  proposal: {
    id: number
    description: string
    proposer: string
    votesFor: number
    votesAgainst: number
    passed: boolean
    ended: boolean
  }
  onVote: (id: number, support: boolean) => void
}

// src/components/governance/VoteButton.tsx - 投票按钮  
// src/components/governance/CreateProposal.tsx - 创建提案表单
// src/components/governance/VotingStats.tsx - 投票统计图表
```

#### 5.3 合约交互
```typescript
// src/hooks/useGovernance.ts - 治理合约hooks
// 包含：getProposals, voteProposal, createProposal, finalizeProposal
```

**AI提示词**:
> 创建治理系统页面，Cyberpunk风格。包含：1)提案卡片列表（带投票状态、进度条）2)投票按钮（发光效果、确认弹窗）3)创建提案表单（玻璃态弹窗、表单验证）4)实时投票统计图表（霓虹色、动画效果）。使用wagmi hooks与智能合约交互。所有交互要有loading状态和成功/错误提示。

---

### 步骤6: 抽奖功能页面 (45分钟)

#### 6.1 抽奖首页
```typescript
// src/app/lottery/page.tsx
功能模块：
- 当前奖池显示 (大数字动画)
- 参与用户列表 (头像网格)
- 开奖按钮 (管理员专用)
- 历史中奖记录
- 参与条件说明
```

#### 6.2 抽奖组件
```typescript
// src/components/lottery/PrizePool.tsx - 奖池显示
interface PrizePoolProps {
  rewardAmount: number
  govAmount: number
  participants: number
}

// src/components/lottery/ParticipantList.tsx - 参与者列表
// src/components/lottery/DrawButton.tsx - 开奖按钮
// src/components/lottery/WinnerHistory.tsx - 中奖历史
// src/components/lottery/DrawAnimation.tsx - 抽奖动画
```

**AI提示词**:
> 创建抽奖系统页面，突出游戏化和刺激感。包含：1)奖池金额大屏显示（数字跳动动画、霓虹发光）2)参与者头像网格（发光效果、hover放大）3)开奖按钮（特殊霓虹动画、权限检查）4)中奖历史列表（时间轴样式）5)抽奖过程动画（转盘或卡片翻转）。使用framer-motion添加刺激的抽奖动画效果。

---

### 步骤7: NFT展示页面 (40分钟)

#### 7.1 NFT画廊
```typescript
// src/app/nft/page.tsx
功能模块：
- 用户NFT展示 (网格布局)
- 参与NFT vs 身份NFT分类
- NFT详情弹窗
- 等级进度显示
- 筛选和搜索功能
```

#### 7.2 NFT组件
```typescript
// src/components/nft/NFTCard.tsx - NFT卡片
interface NFTCardProps {
  nft: {
    id: number
    name: string
    image: string
    type: 'participation' | 'status'
    tier?: number
    description: string
  }
  onClick: () => void
}

// src/components/nft/NFTModal.tsx - NFT详情弹窗
// src/components/nft/TierProgress.tsx - 等级进度条
// src/components/nft/NFTGallery.tsx - NFT网格展示
```

**AI提示词**:
> 创建NFT展示页面，艺术感强烈。包含：1)NFT卡片网格（3D hover效果、反光动画）2)身份等级进度条（霓虹渐变、动态进度）3)NFT详情弹窗（大图展示、属性列表）4)筛选和排序功能（类型、稀有度）5)空状态设计（鼓励参与）。强调视觉层次和交互动画，每个NFT卡片要有独特的发光效果。

---

### 步骤8: 用户仪表板 (35分钟)

#### 8.1 仪表板页面
```typescript
// src/app/dashboard/page.tsx
功能模块：
- 用户资产概览 (代币余额)
- 参与历史时间线
- 成就展示
- 快捷操作面板
- 统计图表
```

#### 8.2 仪表板组件
```typescript
// src/components/dashboard/AssetOverview.tsx - 资产概览
interface AssetOverviewProps {
  govBalance: number
  rewardBalance: number
  nftCount: number
  totalVotes: number
}

// src/components/dashboard/ActivityFeed.tsx - 活动动态
// src/components/dashboard/Achievements.tsx - 成就徽章
// src/components/dashboard/QuickActions.tsx - 快捷操作
// src/components/dashboard/StatsChart.tsx - 统计图表
```

**AI提示词**:
> 创建用户仪表板，信息密度高但层次清晰。包含：1)资产卡片（GOV/REWARD代币余额、增长趋势）2)最近活动时间线（投票、中奖记录）3)成就徽章墙（解锁动画）4)快捷操作按钮组（发光CTA按钮）5)参与度统计图表（霓虹色数据可视化）。使用卡片布局，每个模块要有独立的玻璃态效果。

---

### 步骤9: 动画和交互优化 (30分钟)

#### 9.1 页面过渡
```typescript
// 使用framer-motion添加：
- 页面切换动画 (淡入淡出)
- 组件进入动画 (从下方滑入)
- hover交互效果 (放大、发光)
- 加载状态动画 (骨架屏、脉冲)
```

#### 9.2 微交互设计
```typescript
// 交互反馈：
- 按钮点击波纹效果
- 表单验证动画
- 数据更新动画
- 错误状态提示
- 成功操作确认
```

#### 9.3 特殊效果
```typescript
// Cyberpunk特效：
- 数字雨背景 (可选)
- 扫描线效果
- 故障艺术 (glitch)
- 霓虹文字动画
```

**AI提示词**:
> 添加流畅的动画和微交互，提升用户体验。包含：1)页面切换淡入效果（stagger动画）2)卡片hover放大发光（3D变换）3)按钮点击波纹效果（霓虹色）4)数据加载骨架屏（脉冲动画）5)成功/错误toast提示（滑入动画）6)特殊Cyberpunk效果（扫描线、故障艺术）。所有动画要符合主题，使用霓虹色和发光效果。

---

### 步骤10: 响应式和优化 (25分钟)

#### 10.1 移动端适配
```typescript
// 响应式调整：
- 导航改为抽屉式 (hamburger menu)
- 卡片布局调整 (单列显示)
- 字体和间距优化
- 触摸友好的交互
- 横屏适配
```

#### 10.2 性能优化
```typescript
// 优化策略：
- 图片懒加载 (next/image)
- 组件代码分割 (dynamic import)
- 缓存策略 (SWR/React Query)
- 错误边界 (Error Boundary)
- 预加载关键资源
```

#### 10.3 可访问性
```typescript
// 无障碍设计：
- 键盘导航支持
- 屏幕阅读器兼容
- 色彩对比度检查
- focus指示器
- ARIA标签
```

**AI提示词**:
> 优化移动端体验和性能。包含：1)响应式断点调整（移动优先）2)移动端导航抽屉（手势支持）3)图片和NFT懒加载（渐进式加载）4)React组件优化（memo、useMemo）5)错误处理机制（友好的错误页面）6)可访问性支持（键盘导航、ARIA）。确保在小屏设备上保持Cyberpunk视觉效果。

---

## 🎯 最终交付清单

### 页面结构
```
- / (首页 - 项目介绍、特性展示)
- /governance (治理页面 - 提案、投票)
- /lottery (抽奖页面 - 奖池、开奖) 
- /nft (NFT展示 - 画廊、等级)
- /dashboard (用户仪表板 - 资产、统计)
```

### 核心功能
- ✅ 钱包连接 (RainbowKit)
- ✅ 治理投票 (创建提案、投票、查看结果)
- ✅ 抽奖参与 (查看奖池、参与抽奖、领取奖励)
- ✅ NFT展示 (参与NFT、身份NFT、等级系统)
- ✅ 资产管理 (代币余额、交易历史)

### 设计要求
- ✅ Cyberpunk霓虹主题 (紫色/青色/粉色)
- ✅ 玻璃态效果 (backdrop-filter)
- ✅ 响应式设计 (移动端友好)
- ✅ 流畅动画 (framer-motion)
- ✅ 高级感UI (科技感、未来感)

### 技术规范
- TypeScript严格模式
- TailwindCSS样式系统
- wagmi Web3集成
- framer-motion动画库
- 组件化开发模式
- 性能优化和可访问性

### 文件结构
```
src/
├── app/
│   ├── page.tsx (首页)
│   ├── governance/page.tsx
│   ├── lottery/page.tsx
│   ├── nft/page.tsx
│   ├── dashboard/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/ (基础组件)
│   ├── layout/ (布局组件)
│   ├── governance/ (治理组件)
│   ├── lottery/ (抽奖组件)
│   ├── nft/ (NFT组件)
│   ├── dashboard/ (仪表板组件)
│   └── wallet/ (钱包组件)
├── hooks/
│   ├── useGovernance.ts
│   ├── useLottery.ts
│   ├── useNFT.ts
│   └── useWallet.ts
├── lib/
│   ├── contracts.ts
│   ├── wagmi.ts
│   └── utils.ts
└── styles/
    └── globals.css
```

**最终AI提示词**:
> 这是一个高端Web3 DAO项目，要求极致的视觉效果和用户体验。整体采用Cyberpunk霓虹主题，每个界面都要有科技感和未来感。重点关注交互动画、视觉层次和品牌一致性。代码要求高质量、可维护、类型安全。所有组件要支持暗色主题，使用玻璃态效果和霓虹发光，创造沉浸式的Web3体验。

---

## 📚 参考资源

### 设计灵感
- [Cyberpunk 2077 UI设计](https://www.behance.net/search/projects?search=cyberpunk%20ui)
- [Dribbble - Crypto Dashboard](https://dribbble.com/search/crypto-dashboard)
- [Foundation.app - NFT平台设计](https://foundation.app/)

### 技术文档
- [Next.js 14 App Router](https://nextjs.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [wagmi Documentation](https://wagmi.sh/)
- [Framer Motion](https://www.framer.com/motion/)
- [RainbowKit](https://www.rainbowkit.com/)

### 组件库参考
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Headless UI](https://headlessui.com/) 