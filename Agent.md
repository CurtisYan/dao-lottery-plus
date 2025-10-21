# Agent 协作指南

本仓库实现了一个集成治理、抽奖与任务激励的 DAO Lottery Plus 实验项目，包含 Hardhat 智能合约与 Next.js 前端两个主要部分。以下说明帮助协作者快速理解目录结构、开发流程与注意事项。

## 1. 目录结构速览
- `contracts/`：Solidity 合约源码，覆盖治理代币、奖励代币、抽奖、NFT 以及治理主合约；`artifacts/` 为编译产物缓存。
- `scripts/`：基于 Hardhat 的 TypeScript 脚本，包含部署、测试流程以及提案、抽奖、任务演示等交互脚本。
- `test/`：Hardhat 测试，当前提供 `lottery.test.ts` 覆盖抽奖流程防重入检查。
- `deployments/latest.json`：最近一次部署输出，记录各合约地址与网络信息。
- `dao-lottery-frontend/`：Next.js + wagmi 前端，采用 App Router；子目录包括 `app/` 页面、`components/` UI 组件、`hooks/` 自定义链上状态 Hook、`lib/` 合约工具与地址管理等。
- `src/app/providers.tsx`：主应用的 React Provider 壳层（当前仅透传 children）。
- `说明/`：现有中文文档，详解系统流程、核心功能与前端开发指南。
- 其他配置文件：`hardhat.config.ts`、`tsconfig.json`、`package.json`、`next.config.mjs` 等。

## 2. 开发环境与依赖
- 约定 Node.js 18+，npm 作为包管理器（根目录与前端目录分别有 `package-lock.json`）。
- 合约侧依赖 Hardhat、`@nomicfoundation/hardhat-toolbox-viem`、OpenZeppelin 以及 `solidity-coverage`。
- 前端侧依赖在 `dao-lottery-frontend/package.json` 中定义，核心包括 Next.js 14 App Router、TailwindCSS、wagmi、viem、Radix UI 等。
- `.env`/环境变量用于配置 `PRIVATE_KEY`、`SEPOLIA_RPC_URL` 以及前端的 `NEXT_PUBLIC_*_ADDRESS` 合约地址。

## 3. 合约开发流程
- `hardhat.config.ts` 设定 Solidity 0.8.28、启用优化，并内置 Sepolia 网络配置。
- 常用命令：
  - `npm install`（根目录）安装合约依赖。
  - `npx hardhat compile` 编译合约。
  - `npx hardhat test` 或 `npx hardhat test test/lottery.test.ts` 运行单测。
  - `npx hardhat run scripts/deploy.ts --network <network>` 部署。
- `scripts/` 下脚本按照功能拆分，如 `create-proposal.ts`、`lottery-draw.ts`、`complete-demo.ts` 等，可在 Hardhat 环境中直接执行，调试实际链上流程。
- 如果新增合约，记得更新前端 `dao-lottery-frontend/src/lib/contracts.ts` 的地址映射或 `deployments/latest.json`。

## 4. 前端开发流程
- 进入 `dao-lottery-frontend/`，执行 `npm install` 安装依赖。
- 开发启动命令：`npm run dev`（默认 `localhost:3000`，使用 `wagmi` 读取本地/测试网链上状态）。
- `src/app/` 采用 App Router：
  - `page.tsx` 提供仪表盘入口，`/dashboard`、`/governance`、`/lottery`、`/tasks`、`/nft`、`/settings` 等页面分模块展示治理与抽奖信息。
  - `web3-providers.tsx`、`client-providers.tsx` 负责在客户端装配 wagmi、RainbowKit 等 Provider。
- `src/hooks/` 实现与合约的读写交互，如 `useGovernance`, `useLottery`, `useTokenBalance` 等；`src/lib/contracts.ts` 管理合约地址缓存与更新逻辑（支持 localStorage 覆盖）。
- UI 组件分布在 `src/components/` 与 `src/components/ui/`，部分复用 shadcn/ui 风格组件。
- Tailwind 样式定义在 `src/app/globals.css` 与 `tailwind.config.js`。

## 5. 文档与知识库
- 现有中文文档位于 `说明/`：
  - 《系统流程与状态图》：整体业务与状态机设计。
  - 《核心功能说明》：模块概述与术语解释。
  - 《DAO Lottery 前端开发指南》：前端结构、组件约定、网络配置建议。
- 本目录下的《优化记录.md》用于记录每次迭代的优化内容；请在完成关键优化后追加条目。

## 6. 协作注意事项
- 合约与前端 ABI/地址需保持同步，更新合约后务必重新生成部署信息并同步前端配置。
- 前端默认使用硬编码的 Sepolia 地址，如需指向本地或其他网络，需在 `.env.local` 设置 `NEXT_PUBLIC_*` 变量或使用前端提供的地址更新逻辑。
- `src/app/providers.tsx` 当前为空壳，如需添加全局 Provider（如国际化、主题），可在此扩展。
- 提交前建议手动运行 `npx hardhat test` 与前端类型检查（`npm run lint` 尚未配置，可考虑添加 ESLint）。
- 仓库包含较多脚本文件，命名遵循“动作-对象”模式；新增脚本时请保持一致并在 README 或文档中登记用途。

如需扩展功能或修复问题，优先查阅 `README.md` 与 `说明/` 下的文档，以确保设计与现有流程保持一致。
