# DAO Lottery - 前端 (Sepolia测试网部署版)

🎯 基于 Next.js + Web3 的去中心化自治组织抽奖治理平台，部署于Sepolia测试网

## 📚 文档导航

- **📖 README.md** (当前文件) - 项目介绍和快速开始
- **🚀 [DEPLOYMENT.md](./DEPLOYMENT.md)** - 详细部署指南和生产环境配置

> 💡 **新用户建议**：先阅读本 README 了解项目，需要部署时再参考 DEPLOYMENT.md

## ✨ 特性

### 🎨 视觉设计

- **Cyberpunk 霓虹主题** - 紫色/青色/粉色配色方案
- **玻璃态效果** - 半透明背景和模糊效果
- **霓虹发光动画** - 按钮和卡片的发光效果
- **响应式设计** - 适配移动端和桌面端

### 🔧 核心功能

- **钱包连接** - 基于 RainbowKit 的 Web3 钱包集成
- **治理投票** - 创建提案、投票、查看结果
- **抽奖系统** - 参与抽奖、查看奖池、历史记录
- **NFT 收藏** - 参与 NFT 和身份 NFT 展示
- **用户仪表板** - 资产概览、活动历史、成就系统

### 🛠 技术栈

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + CSS 动画
- **Web3**: wagmi v2 + RainbowKit + viem
- **State**: React Query (@tanstack/react-query)
- **Toast**: Sonner (轻量级通知组件)
- **Icons**: Lucide React
- **Components**: 自定义 Cyberpunk 主题组件库

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- MetaMask 或其他兼容的 Web3 钱包

### 网络选择

本项目使用Sepolia测试网部署

### 1. 克隆项目

```bash
git clone https://github.com/CurtisYan/dao-lottery-plus

cd dao-lottery-plus-master
```

### 2. 部署智能合约

#### Sepolia 测试网部署（推荐）

```bash
# 创建 .env 文件并配置
cat > .env << EOL
PRIVATE_KEY=你的钱包私钥
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/你的API密钥
EOL

# 部署到 Sepolia 测试网
npx hardhat run scripts/deploy.ts --network sepolia
```

部署后，记录下终端输出的合约地址，用于下一步配置。



### 3. 配置前端环境

```bash
cd dao-lottery-frontend

# 创建环境变量文件 (使用你部署的合约地址)
cat > .env.local << EOL
# Sepolia 测试网配置
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia.publicnode.com
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=你的WalletConnect项目ID

# 合约地址 (替换为你的部署地址)
NEXT_PUBLIC_GOVTOKEN_ADDRESS=0x你的GovToken地址
NEXT_PUBLIC_REWARDTOKEN_ADDRESS=0x你的RewardToken地址
NEXT_PUBLIC_PARTICIPATIONNFT_ADDRESS=0x你的ParticipationNFT地址
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x你的Governance地址
NEXT_PUBLIC_LOTTERY_ADDRESS=0x你的Lottery地址
NEXT_PUBLIC_STATUSNFT_ADDRESS=0x你的StatusNFT地址
EOL
```

---

### ⚠️ 手动更新合约地址说明

> **注意：目前只有 .env.local 会被部署脚本自动更新，前端代码中的部分硬编码地址需要你手动同步！**

每次重新部署合约后，请务必同步更新以下文件中的合约地址：

1. `.env.local`（自动更新，优先级最高）
2. `src/lib/contracts.ts`（硬编码的 SEPOLIA_CONTRACT_ADDRESSES，需手动同步）
3. `src/lib/deployListener.ts`（DEFAULT_ADDRESSES，需手动同步）

否则前端可能会读取到旧地址或错误地址，导致合约交互异常。

---

### 4. 安装依赖并启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
dao-lottery-frontend/
├── src/
│   ├── app/                    # Next.js App Router页面
│   │   ├── page.tsx           # 首页
│   │   ├── governance/        # 治理页面
│   │   ├── lottery/          # 抽奖页面
│   │   ├── nft/              # NFT展示页面
│   │   ├── dashboard/        # 用户仪表板
│   │   ├── settings/         # 设置页面
│   │   ├── client-providers.tsx # 客户端Provider
│   │   ├── web3-providers.tsx   # Web3 Provider
│   │   ├── layout.tsx        # 全局布局
│   │   └── globals.css       # 全局样式
│   ├── components/            # UI组件库
│   │   ├── ui/               # 基础UI组件
│   │   ├── layout/           # 布局组件
│   │   └── wallet/           # 钱包相关组件
│   ├── hooks/                # 自定义React Hooks
│   │   ├── useTokenBalance.ts # 代币余额hooks
│   │   ├── useGovernance.ts  # 治理相关hooks
│   │   ├── useLottery.ts    # 抽奖相关hooks
│   │   └── useNFT.ts        # NFT相关hooks
│   └── lib/                  # 工具函数和配置
│       ├── contracts.ts      # 智能合约配置
│       ├── wagmi.ts         # Web3配置
│       ├── deployListener.ts # 合约部署监听
│       └── utils.ts         # 工具函数
├── .env.local               # 环境变量配置
├── package.json             # 项目依赖
├── tailwind.config.js       # Tailwind配置
├── next.config.js          # Next.js配置
└── tsconfig.json           # TypeScript配置
```

## 🎨 设计系统

### 颜色配置

```css
--primary: #8B5CF6      /* 紫色 */
--secondary: #06B6D4    /* 青色 */
--accent: #EC4899       /* 粉色 */
--background: #0F0F23   /* 深蓝黑 */
--surface: #1A1B3A      /* 深紫灰 */
```

### 组件变体

- **按钮**: primary, secondary, ghost, danger
- **卡片**: default, glass, glow, neon
- **徽章**: 多种颜色变体和大小
- **进度条**: 霓虹发光效果和动画
- **通知**: 使用 Sonner 实现的轻量级通知

### 动画效果

- `glow` - 霓虹发光动画
- `float` - 浮动效果
- `pulse-glow` - 脉冲发光
- `scan-line` - 扫描线效果

## 🔌 Web3 集成

### 支持的网络

- **Sepolia 测试网**

### 智能合约地址配置

合约地址通过以下方式配置：

1. **环境变量** (`.env.local`)
2. **本地存储** (localStorage)
3. **自动检测** (deployListener.ts)

```typescript
// 当前配置的合约地址示例 (请替换为你的实际部署地址)
CONTRACT_ADDRESSES = {
  GovToken: "0x...",
  RewardToken: "0x...",
  ParticipationNFT: "0x...",
  StatusNFT: "0x...",
  Governance: "0x...",
  Lottery: "0x...",
};
```

### 自定义 Hooks

- `useTokenBalance` - 获取代币余额
- `useGovTokenBalance` - GOV 代币余额
- `useRewardTokenBalance` - REWARD 代币余额
- `useUserNFTs` - 用户 NFT 信息
- `useGovernance` - 治理相关功能
- `useLottery` - 抽奖相关功能

## 📱 页面功能

### 🏠 首页 (`/`)

- 项目介绍和特性展示
- 统计数据概览
- CTA 按钮引导用户参与

### 🗳 治理页面 (`/governance`)

- 提案列表和详情
- 投票功能（支持/反对）
- 创建新提案
- 投票进度可视化

### 🎲 抽奖页面 (`/lottery`)

- 当前奖池显示
- 参与者列表和概率
- 中奖历史记录
- 管理员开奖功能

### 🖼 NFT 页面 (`/nft`)

- NFT 收藏展示
- 参与 NFT vs 身份 NFT
- 等级进度系统
- NFT 详情弹窗

### 📊 仪表板 (`/dashboard`)

- 用户资产概览
- 活动历史时间线
- 成就系统
- 快捷操作面板

### ⚙️ 设置页面 (`/settings`)

- 合约地址配置
- 网络设置
- 自动检测合约部署

## 🛠 开发命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 代码质量
npm run lint         # ESLint检查
npm run type-check   # TypeScript类型检查

# 维护
npm run clean        # 清理缓存
```

## 🎯 技术亮点

### 1. 现代化架构

- Next.js 15 App Router
- TypeScript 严格模式
- 服务端和客户端渲染分离

### 2. Web3 最佳实践

- wagmi v2 最新 API
- RainbowKit 钱包集成
- 合约读写分离
- 错误处理和重试机制
- 自动合约地址检测

### 3. UI/UX 设计

- Cyberpunk 科技感主题
- 流畅的动画和过渡
- 响应式布局
- 无障碍支持
- 友好的通知系统 (Sonner)

### 4. 性能优化

- 组件代码分割
- 图片懒加载
- React Query 缓存
- 构建优化
- SSR/CSR 优化

## 🔄 开发流程

### 1. 本地开发

1. 启动 Hardhat 网络 (`npx hardhat node`)
2. 部署智能合约 (`npx hardhat run scripts/deploy.ts --network localhost`)
3. 更新合约地址配置 (`.env.local`)
4. 启动前端开发服务器 (`npm run dev`)

### 2. 测试部署

1. 连接测试网
2. 更新环境变量
3. 构建和部署

### 3. 生产发布

1. 配置生产环境
2. 优化性能
3. 部署到 CDN

## 🎨 定制化

### 修改主题颜色

编辑 `tailwind.config.js`:

```javascript
colors: {
  primary: "#你的颜色",
  secondary: "#你的颜色",
  accent: "#你的颜色"
}
```

### 添加新页面

1. 在 `src/app/` 下创建目录
2. 添加 `page.tsx` 文件
3. 更新导航配置

### 扩展组件

1. 在 `src/components/ui/` 添加新组件
2. 使用 `class-variance-authority` 定义变体
3. 添加 TypeScript 类型定义

## 🚨 常见问题

### 1. 合约地址无效

```bash
# 解决方案
1. 检查 .env.local 文件中的地址
2. 清除浏览器 localStorage
3. 重新部署合约并更新地址
```

### 2. 钱包连接失败

```bash
# 解决方案
1. 确保Hardhat节点正在运行
2. 检查网络配置 (localhost:8545)
3. 确认MetaMask连接到正确网络
```

### 3. 构建错误

```bash
# 解决方案
1. 清理缓存: npm run clean
2. 重新安装依赖: rm -rf node_modules && npm install
3. 检查TypeScript错误: npm run type-check
```

## 🚀 部署指南

> 📖 **详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)**

部署到生产环境需要：

- 配置生产网络 (主网/测试网)
- 部署智能合约
- 更新环境变量
- 配置域名和 SSL
- 设置监控和分析

## 📄 License

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

---

🎮 **体验未来感的 DAO 治理平台!**

由 [DAO Lottery](https://gitee.com/alan223/dao-lottery-plus) 团队精心打造 ⚡

## 环境变量配置指南

本项目使用环境变量来管理智能合约地址。正确设置环境变量对于应用程序的正常运行至关重要。

### 必需的环境变量

以下是应用程序运行所需的关键环境变量：

```
NEXT_PUBLIC_GOVTOKEN_ADDRESS=0x...      # 治理代币合约地址
NEXT_PUBLIC_REWARDTOKEN_ADDRESS=0x...   # 奖励代币合约地址
NEXT_PUBLIC_PARTICIPATIONNFT_ADDRESS=0x... # 参与NFT合约地址
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x...    # 治理合约地址
NEXT_PUBLIC_LOTTERY_ADDRESS=0x...       # 抽奖合约地址
NEXT_PUBLIC_STATUSNFT_ADDRESS=0x...     # 状态NFT合约地址
```

### 环境变量设置方法

1. **自动设置**：运行部署脚本时，环境变量会自动写入到 `.env.local` 文件中
2. **手动设置**：可以手动创建以下文件并添加环境变量
   - `.env.local`：本地开发环境（优先级最高）
   - `.env.development`：开发环境配置
   - `.env`：默认配置

### 故障排除

如果您遇到与合约地址相关的问题，可以尝试以下解决方案：

1. **检查环境变量文件**：
   - 确保 `.env.local` 文件存在并包含所有必需的环境变量
   - 检查环境变量值是否有效（必须是有效的以"0x"开头的以太坊地址）
   - 确保没有多余的空格、换行符或特殊字符

2. **合约未找到**：
   - 确认本地区块链节点是否正在运行
   - 验证合约是否已成功部署
   - 检查网络配置是否与部署合约的网络匹配

3. **刷新问题**：
   - 清除浏览器缓存和本地存储
   - 重新启动开发服务器
   - 确保没有其他开发服务器实例在运行

4. **恢复默认配置**：
   - 删除 `.env.local` 文件
   - 重新运行部署脚本以生成新的环境变量文件

## 联系与支持

如有问题，请提交Issue或联系项目维护者。
