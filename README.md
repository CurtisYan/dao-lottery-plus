# DAO-Lottery-Plus

一个集成治理、抽奖、任务激励与恶意提案防御的去中心化自治组织实验项目，合约采用 Hardhat 开发，前端基于 Next.js + wagmi 构建。

## 📚 项目概览

- **治理代币 (GOV)**：灵魂绑定、不可转账，只能通过 DAO 授予或任务奖励获得。
- **奖励代币 (RWD)**：抽奖奖池的主要奖励，支持外部用途或流通。
- **NFT 体系**：
  - ParticipationNFT：正确投票即可领取，记录贡献。
  - StatusNFT：依据治理等级划分（白银/黄金/钻石/王者），解锁不同治理权限。
- **治理核心**：提案创建、投票、抽奖、任务激励与恶意提案的二次投票删除流程全部链上执行，前端实时展示状态。

> 👉 更详细的流程图、时序说明和权限对照表请查看 [《系统流程与状态图》](说明/系统流程与状态图.md)。

## 🧱 系统组成

### 智能合约模块

| 合约 | 作用 | 关键更新 |
| --- | --- | --- |
| `GovToken.sol` | GOV 灵魂绑定治理代币 | 新增 `slash` 支持惩罚恶意提案创建者 |
| `RewardToken.sol` | RWD 奖励代币 | 负责抽奖奖励铸造 |
| `ParticipationNFT.sol` | 参与凭证 NFT | 正确投票自动发放 |
| `StatusNFT.sol` | 身份等级 NFT | 与 GOV 余额联动，控制治理权限 |
| `Governance.sol` | 治理核心逻辑 | 任务奖励、提案投票、抽奖概率计算、恶意提案二次投票删除 |
| `Lottery.sol` | 抽奖逻辑 | 读取治理模块结果，发放奖励 |

### 前端应用

- **框架**：Next.js App Router、TypeScript、TailwindCSS、wagmi。
- **主要页面**：
  - `/governance`：提案、投票、二次删除投票全流程交互。
  - `/lottery`：展示动态奖池、真实中奖概率、历史开奖记录。
  - `/tasks`：任务列表、链上领取奖励、冷却状态提示。
- **数据层**：自定义 `useGovernance` Hook 负责读取合约状态并触发交易。

## 🔄 核心流程速览

### 抽奖概率与奖池分配

- 抽奖基于真实参与人数计算概率，概率 = `1 / 当前奖池候选人数量`。
- 奖池来源：正确投票用户支付的 GOV 门票。
- 结算时：
  - 80% 门票价值转换为 RWD，平均分给中奖者；
  - 20% GOV 被销毁；
  - 中奖者额外领取 11 个 GOV 奖励 + ParticipationNFT。

### 任务奖励发放

1. 管理员通过合约登记任务（包含奖励 GOV 数量、冷却时间、是否可重复等）。
2. 用户在前端完成任务后触发 `completeTask`，由合约验证资格并直接铸造 GOV 给用户。
3. 前端实时刷新任务状态（冷却倒计时、可领取次数）以及 GOV 余额，确保显示与链上一致。

### 恶意提案二次投票删除

1. **提案标记**：任意符合条件的成员可以发起“恶意提案删除”流程。
2. **资格判定**（满足其一即可）：
   - 拥有高等级 StatusNFT + 较低 GOV 门槛；
   - 拥有低等级 StatusNFT + 更高 GOV 门槛。
3. **投票阶段**：成员根据自身等级和持币情况参与删除投票，合约记录赞成/反对数量。
4. **结算阶段**：达到删除阈值后执行：
   - 提案状态变为 `Removed`；
   - 恶意提案发起人被扣除 50% GOV（通过 `GovToken.slash`）。
5. 前端展示每个阶段的资格说明、冷却时间以及惩罚结果。

## 🚀 部署与运行

### 环境要求

- Node.js 18+
- pnpm / npm
- Hardhat（随项目依赖提供）

### 合约部署流程

```bash
# 安装依赖
npm install

# 部署到本地 Hardhat 网络
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

部署脚本会按顺序完成以下操作：

1. 部署 GovToken、RewardToken、ParticipationNFT、StatusNFT。
2. 部署 Governance（传入 GovToken、ParticipationNFT、StatusNFT 地址）。
3. 部署 Lottery，并在 Governance 中登记 Lottery 地址。
4. 设置各合约的 minter/ownership 权限，保证任务奖励、抽奖等流程可用。

### 前端启动

```bash
cd dao-lottery-frontend
npm install
npm run dev
```

启动后默认连接 `localhost:8545`，可在 `.env` 中自定义 RPC 及合约地址。

## 🛠️ 开发提示

- 若在 CI/无网络环境编译合约，可预下载 Solidity 编译器或使用离线缓存。
- `npm run lint` 尚未配置，建议在后续迭代中补充 ESLint 规范。
- 前端的 wagmi `config` 支持多网络切换，但任务奖励、恶意提案流程依赖最新 ABI，请保持合约与前端同步更新。

## 📄 文档索引

- [《系统流程与状态图》](说明/系统流程与状态图.md)：涵盖任务奖励、恶意提案删除、抽奖发奖等全链路时序图与角色权限说明。
- [《核心功能说明》](说明/核心功能说明.md)：功能列表与术语简介。
- [《DAO Lottery 前端开发指南》](说明/FRONTEND_DEVELOPMENT_GUIDE.md)：前端设计与代码结构建议。

欢迎根据 DAO 的实际运营情况继续扩展任务种类、治理阈值以及奖池算法，以保证社区长期健康发展。
