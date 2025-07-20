# 🚀 DAO Lottery 前端部署流程

## 📋 部署前检查清单

### ✅ 必需配置项
- [ ] 智能合约已部署完成
- [ ] 获取所有合约地址
- [ ] 准备WalletConnect Project ID
- [ ] 配置域名和SSL证书 (生产环境)
- [ ] 准备RPC端点 (生产环境)

---

## 🔧 1. 关键信息更换

### 1.1 智能合约地址配置

**文件**: `dao-lottery-frontend/.env.local`

```bash
# 本地开发环境配置
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_GOV_TOKEN_ADDRESS=
NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=
NEXT_PUBLIC_PARTICIPATION_NFT_ADDRESS=
NEXT_PUBLIC_GOVERNANCE_ADDRESS=
NEXT_PUBLIC_LOTTERY_ADDRESS=
NEXT_PUBLIC_STATUS_NFT_ADDRESS=
```

**注意**: 这些地址是本地Hardhat网络的地址，生产环境需要替换为实际部署的合约地址。

### 1.2 网络配置

**文件**: `dao-lottery-frontend/src/lib/wagmi.ts`

```typescript
// 当前配置 - 本地开发
const localChain = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
} as const

// 生产环境配置示例
const mainnetChain = {
  id: 1,
  name: 'Ethereum',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.infura.io/v3/YOUR_KEY'] },
    default: { http: ['https://mainnet.infura.io/v3/YOUR_KEY'] },
  },
} as const
```

### 1.3 环境变量配置

**创建文件**: `dao-lottery-frontend/.env.local`

```bash
# 本地开发环境
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_GOV_TOKEN_ADDRESS=0xdc64a140aa3e981100a9beca4e685f962f0cf6c9
NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=0x5fc8d32690cc91d4c39d9d3abcbd16989f875707
NEXT_PUBLIC_PARTICIPATION_NFT_ADDRESS=0x0165878a594ca255338adfa4d48449f69242eb8f
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0xa513e6e4b8f2a923d98304ec87f64353c4d5c853
NEXT_PUBLIC_LOTTERY_ADDRESS=0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6
NEXT_PUBLIC_STATUS_NFT_ADDRESS=0x8a791620dd6260079bf849dc5567adc3f2fdc318

# 生产环境配置 (需要替换)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=你的WalletConnect项目ID
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/你的Infura密钥
NEXT_PUBLIC_CHAIN_ID=1

# 应用配置
NEXT_PUBLIC_APP_NAME="DAO Lottery"
NEXT_PUBLIC_APP_DESCRIPTION="去中心化自治组织抽奖平台"
NEXT_PUBLIC_APP_URL=https://你的域名.com

# IPFS配置 (可选)
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_NFT_METADATA_BASE=https://你的IPFS节点/

# 分析和监控 (可选)
NEXT_PUBLIC_GA_ID=G-你的Google Analytics ID
NEXT_PUBLIC_SENTRY_DSN=你的Sentry DSN
```

### 1.4 NFT元数据配置

**文件**: `dao-lottery-frontend/src/lib/contracts.ts`

```typescript
export const NFT_CONFIG = {
  ParticipationNFT: {
    baseURI: process.env.NEXT_PUBLIC_PARTICIPATION_BASE_URI || "https://ipfs.io/ipfs/QmYourParticipationNFTMetadata/",
    name: "DAO Participation NFT",
    symbol: "DPNFT"
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
      { threshold: 10000, name: "Diamond Member", color: "#B9F2FF" }
    ]
  }
} as const
```

---

## 🌐 2. 网络环境部署

### 2.1 本地开发环境

```bash
# 1. 启动Hardhat节点
npx hardhat node

# 2. 部署合约 (新终端)
npx hardhat run scripts/deploy.ts --network localhost

# 3. 配置前端环境变量
cd dao-lottery-frontend
cat > .env.local << EOL
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_GOV_TOKEN_ADDRESS=0xdc64a140aa3e981100a9beca4e685f962f0cf6c9
NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=0x5fc8d32690cc91d4c39d9d3abcbd16989f875707
NEXT_PUBLIC_PARTICIPATION_NFT_ADDRESS=0x0165878a594ca255338adfa4d48449f69242eb8f
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0xa513e6e4b8f2a923d98304ec87f64353c4d5c853
NEXT_PUBLIC_LOTTERY_ADDRESS=0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6
NEXT_PUBLIC_STATUS_NFT_ADDRESS=0x8a791620dd6260079bf849dc5567adc3f2fdc318
EOL

# 4. 启动前端
npm install
npm run dev
```

### 2.2 测试网部署 (Sepolia)

#### 2.2.1 准备开发环境

```bash
# 1. 安装Node.js和npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
nvm install 18
npm install -g yarn

# 2. 安装MetaMask
# 在浏览器中安装MetaMask插件

# 3. 获取Sepolia测试网ETH
# 从[Sepolia水龙头](https://sepoliafaucet.com/)获取Sepolia测试网ETH

# 4. 配置Alchemy或Infura API密钥
# 在Alchemy或Infura控制台创建Sepolia网络项目，获取API密钥
```

#### 2.2.2 配置环境变量

在项目根目录创建`.env`文件：

```bash
# 创建环境变量文件
cat > .env << EOL
# 你的钱包私钥（请确保这是测试钱包，不要使用主网钱包）
PRIVATE_KEY=你的钱包私钥

# Sepolia RPC节点URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/你的API密钥
EOL
```

#### 2.2.3 部署智能合约

```bash
# 部署智能合约
npx hardhat run scripts/deploy.ts --network sepolia
```

部署成功后，终端会输出所有已部署合约的地址。请记录这些地址，用于后续的前端配置。

示例输出：
```
GovToken deployed to: 0x...
RewardToken deployed to: 0x...
ParticipationNFT deployed to: 0x...
StatusNFT deployed to: 0x...
Governance deployed to: 0x...
Lottery deployed to: 0x...
```

部署完成后，这些合约地址也会保存在`deployments/latest.json`文件中。

#### 2.2.4 配置前端应用

进入前端项目目录：

```bash
cd dao-lottery-frontend
```

创建`.env.local`文件：

```bash
cat > .env.local << EOL
# Sepolia测试网配置
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia.publicnode.com
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=你的WalletConnect项目ID（可选）

# 合约地址（替换为你的部署地址）
NEXT_PUBLIC_GOVTOKEN_ADDRESS=0x你的GovToken地址
NEXT_PUBLIC_REWARDTOKEN_ADDRESS=0x你的RewardToken地址
NEXT_PUBLIC_PARTICIPATIONNFT_ADDRESS=0x你的ParticipationNFT地址
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x你的Governance地址
NEXT_PUBLIC_LOTTERY_ADDRESS=0x你的Lottery地址
NEXT_PUBLIC_STATUSNFT_ADDRESS=0x你的StatusNFT地址
EOL
```

#### 2.2.5 运行前端应用

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式运行

```bash
npm run dev
# 或
yarn dev
```

应用将在`http://localhost:3000`启动。

### 构建生产版本

```bash
npm run build
npm start
# 或
yarn build
yarn start
```

### 2.3 主网部署 (Mainnet)

```bash
# 1. 更新网络配置
# 在 wagmi.ts 中使用 mainnet

# 2. 设置环境变量
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=1

# 3. 构建优化版本
npm run build
```

---

## 📦 3. 构建和部署流程

### 3.1 本地构建验证

```bash
# 1. 安装依赖
npm install

# 2. 类型检查
npm run type-check

# 3. ESLint检查
npm run lint

# 4. 构建生产版本
npm run build

# 5. 本地预览
npm run start
```

### 3.2 Vercel 部署

**方法一: Vercel CLI**

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录Vercel
vercel login

# 3. 初始化项目
cd dao-lottery-frontend
vercel

# 4. 设置环境变量
vercel env add NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
vercel env add NEXT_PUBLIC_RPC_URL
vercel env add NEXT_PUBLIC_GOV_TOKEN_ADDRESS
vercel env add NEXT_PUBLIC_REWARD_TOKEN_ADDRESS
vercel env add NEXT_PUBLIC_PARTICIPATION_NFT_ADDRESS
vercel env add NEXT_PUBLIC_GOVERNANCE_ADDRESS
vercel env add NEXT_PUBLIC_LOTTERY_ADDRESS
vercel env add NEXT_PUBLIC_STATUS_NFT_ADDRESS

# 5. 部署
vercel --prod
```

**方法二: GitHub集成**

1. 连接GitHub仓库到Vercel
2. 在Vercel后台设置环境变量
3. 推送代码自动部署

### 3.3 Netlify 部署

```bash
# 1. 构建命令
npm run build

# 2. 发布目录
.next

# 3. 环境变量设置
# 在Netlify后台添加所有NEXT_PUBLIC_*变量
```

### 3.4 自托管部署

```bash
# 1. 服务器配置
# Ubuntu/CentOS服务器
# Node.js 18+
# Nginx反向代理

# 2. 构建和上传
npm run build
scp -r .next/ user@server:/path/to/app/

# 3. 服务器启动
npm run start

# 4. Nginx配置
server {
    listen 80;
    server_name 你的域名.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔐 4. 安全配置

### 4.1 域名和SSL

```bash
# 1. 配置DNS记录
A记录: @ -> 服务器IP
A记录: www -> 服务器IP

# 2. SSL证书 (Let's Encrypt)
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com
```

### 4.2 安全头配置

**文件**: `dao-lottery-frontend/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        }
      ],
    },
  ],
}

module.exports = nextConfig
```

---

## 📊 5. 监控和分析

### 5.1 Google Analytics

**文件**: `dao-lottery-frontend/src/app/layout.tsx`

```typescript
// 添加Google Analytics
import Script from 'next/script'

export default function RootLayout() {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>...</body>
    </html>
  )
}
```

### 5.2 错误监控 (Sentry)

```bash
# 1. 安装Sentry
npm install @sentry/nextjs

# 2. 配置 sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## 🧪 6. 测试和验证

### 6.1 功能测试检查表

- [ ] 钱包连接功能正常
- [ ] 所有页面加载正常
- [ ] 智能合约交互正常
- [ ] 响应式设计在移动端正常
- [ ] 网络切换功能正常
- [ ] 错误处理机制正常
- [ ] 合约地址自动检测正常

### 6.2 性能测试

```bash
# 1. Lighthouse性能测试
npm install -g lighthouse
lighthouse https://你的域名.com

# 2. Web Vitals检查
# 使用Chrome DevTools

# 3. 负载测试
# 使用k6或Artillery
```

### 6.3 安全测试

```bash
# 1. 依赖漏洞扫描
npm audit

# 2. HTTPS配置检查
# 使用SSL Labs测试

# 3. Web安全扫描
# 使用OWASP ZAP
```

---

## 🚀 7. 部署脚本

**创建文件**: `dao-lottery-frontend/deploy.sh`

```bash
#!/bin/bash

echo "🚀 开始部署 DAO Lottery 前端..."

# 1. 检查环境
echo "📋 检查部署环境..."
node --version
npm --version

# 2. 安装依赖
echo "📦 安装依赖..."
npm ci

# 3. 代码质量检查
echo "🔍 代码质量检查..."
npm run type-check
npm run lint

# 4. 构建项目
echo "🏗️ 构建项目..."
npm run build

# 5. 部署到服务器
echo "🌐 部署到生产环境..."
if [ "$1" = "vercel" ]; then
    vercel --prod
elif [ "$1" = "netlify" ]; then
    netlify deploy --prod
else
    echo "请指定部署平台: ./deploy.sh vercel 或 ./deploy.sh netlify"
fi

echo "✅ 部署完成!"
```

**使用方法**:

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 部署到Vercel
./deploy.sh vercel

# 部署到Netlify  
./deploy.sh netlify
```

---

## 📝 8. 部署后检查

### 8.1 立即检查

- [ ] 网站可以正常访问
- [ ] HTTPS证书正常
- [ ] 钱包连接功能正常
- [ ] 所有页面路由正常
- [ ] API请求正常
- [ ] 移动端适配正常
- [ ] 合约地址配置正确

### 8.2 24小时后检查

- [ ] 监控数据正常
- [ ] 错误日志检查
- [ ] 性能指标达标
- [ ] 用户反馈收集

---

## 🔄 9. 持续部署 (CI/CD)

### 9.1 GitHub Actions

**文件**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      working-directory: ./dao-lottery-frontend
    
    - name: Type check
      run: npm run type-check
      working-directory: ./dao-lottery-frontend
    
    - name: Lint
      run: npm run lint
      working-directory: ./dao-lottery-frontend
    
    - name: Build
      run: npm run build
      working-directory: ./dao-lottery-frontend
      env:
        NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: ${{ secrets.WALLET_CONNECT_PROJECT_ID }}
        NEXT_PUBLIC_RPC_URL: ${{ secrets.RPC_URL }}
        NEXT_PUBLIC_GOV_TOKEN_ADDRESS: ${{ secrets.GOV_TOKEN_ADDRESS }}
        NEXT_PUBLIC_REWARD_TOKEN_ADDRESS: ${{ secrets.REWARD_TOKEN_ADDRESS }}
        NEXT_PUBLIC_PARTICIPATION_NFT_ADDRESS: ${{ secrets.PARTICIPATION_NFT_ADDRESS }}
        NEXT_PUBLIC_GOVERNANCE_ADDRESS: ${{ secrets.GOVERNANCE_ADDRESS }}
        NEXT_PUBLIC_LOTTERY_ADDRESS: ${{ secrets.LOTTERY_ADDRESS }}
        NEXT_PUBLIC_STATUS_NFT_ADDRESS: ${{ secrets.STATUS_NFT_ADDRESS }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
        working-directory: ./dao-lottery-frontend
```

---

## 📞 10. 故障排除

### 10.1 常见问题

**问题**: 钱包连接失败
```bash
# 解决方案
1. 检查WalletConnect Project ID
2. 验证网络配置
3. 确认RPC端点可用
4. 检查浏览器控制台错误
```

**问题**: 合约调用失败
```bash
# 解决方案  
1. 验证合约地址正确
2. 检查ABI匹配
3. 确认网络ID正确
4. 检查合约是否已部署
```

**问题**: 构建失败
```bash
# 解决方案
1. 清理缓存: npm run clean
2. 重新安装: rm -rf node_modules && npm install
3. 检查TypeScript错误: npm run type-check
4. 检查环境变量配置
```

**问题**: 合约地址无效
```bash
# 解决方案
1. 检查 .env.local 文件中的地址
2. 清除浏览器 localStorage
3. 重新部署合约并更新地址
4. 使用设置页面的自动检测功能
```

### 10.2 回滚计划

```bash
# 1. 保留前一版本
git tag v1.0.0

# 2. 快速回滚
git checkout v1.0.0
cd dao-lottery-frontend
npm run build
./deploy.sh vercel
```

---

## 🎯 部署完成 ✅

恭喜！你的 DAO Lottery 前端已成功部署！

**下一步**:
1. 📊 监控性能和错误
2. 📝 收集用户反馈  
3. 🔄 计划功能迭代
4. 🛡️ 定期安全更新

---

*Happy Deploying! 🚀* 