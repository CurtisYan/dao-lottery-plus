// scripts/deploy.ts
import hre from "hardhat";
import "dotenv/config";
import { formatEther, parseEther } from "viem";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（替代__dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 记录合约部署信息的函数
async function saveDeploymentInfo(contracts: Record<string, string>) {
  try {
    // 保存到文件
    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    // 添加时间戳
    const timestamp = new Date().toISOString();
    const deploymentFile = path.join(deploymentPath, `deployment-${timestamp.replace(/:/g, "-")}.json`);
    
    // 添加网络信息
    const networkName = hre.network.name;
    // 根据网络名称确定chainId
    const chainId = networkName === 'sepolia' ? 11155111 : 31337;
    
    const deploymentData = {
      timestamp,
      network: networkName,
      chainId,
      contracts
    };
    
    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(deploymentData, null, 2)
    );
    
    // 更新最新部署文件
    const latestFile = path.join(deploymentPath, "latest.json");
    fs.writeFileSync(
      latestFile,
      JSON.stringify(deploymentData, null, 2)
    );
    
    console.log(`📝 Deployment info saved to ${deploymentFile}`);
    
    // 同时更新前端的环境变量
    const envContent = Object.entries(contracts)
      .map(([name, address]) => `NEXT_PUBLIC_${name.toUpperCase()}_ADDRESS=${address}`)
      .join("\n");
    
    // 更新前端目录的.env.local
    const frontendEnvPath = path.join(__dirname, "../dao-lottery-frontend/.env.local");
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log(`📝 Frontend environment variables updated at ${frontendEnvPath}`);
    
    // 同时更新根目录的.env.local (保持同步)
    const rootEnvPath = path.join(__dirname, "../.env.local");
    fs.writeFileSync(rootEnvPath, envContent);
    console.log(`📝 Root environment variables updated at ${rootEnvPath}`);
    
    return true;
  } catch (error) {
    console.error("Failed to save deployment info:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting deployment process...");

  const publicClient = await hre.viem.getPublicClient();

  // 1. 获取部署者账户
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deploying contracts with the account: ${deployer.account.address}`);
  console.log(`Account balance: ${formatEther(await publicClient.getBalance({ address: deployer.account.address }))} ETH`);
  console.log("----------------------------------------------------");

  // 2. 定义初始参数
  const initialSupply = parseEther("1000000"); // 假设初始供应量为 1,000,000
  const participationBaseURI = process.env.PARTICIPATION_BASE_URI!;
  if (!participationBaseURI) {
    throw new Error("PARTICIPATION_BASE_URI not found in .env file");
  }

  // =================================================================
  //                       CONTRACT DEPLOYMENT
  // =================================================================
  console.log("➡️  Deploying contracts...");

  // 部署 GovToken
  const govToken = await hre.viem.deployContract("GovToken", [initialSupply]);
  console.log(`✅ GovToken deployed to: ${govToken.address}`);

  // 部署 RewardToken
  const rewardToken = await hre.viem.deployContract("RewardToken", [initialSupply]);
  console.log(`✅ RewardToken deployed to: ${rewardToken.address}`);

  // 部署 ParticipationNFT
  const participationNFT = await hre.viem.deployContract("ParticipationNFT", [participationBaseURI]);
  console.log(`✅ ParticipationNFT deployed to: ${participationNFT.address}`);

  // 部署 Governance
  const governance = await hre.viem.deployContract("Governance", [
    govToken.address,
    participationNFT.address
  ]);
  console.log(`✅ Governance deployed to: ${governance.address}`);

  // 部署 Lottery
  const lottery = await hre.viem.deployContract("Lottery", [
    rewardToken.address,
    governance.address,
  ]);
  console.log(`✅ Lottery deployed to: ${lottery.address}`);

  // 部署 StatusNFT
  const statusNFT = await hre.viem.deployContract("StatusNFT", [govToken.address]);
  console.log(`✅ StatusNFT deployed to: ${statusNFT.address}`);

  console.log("\n----------------------------------------------------");
  
  // =================================================================
  //                       INITIAL CONFIGURATION
  // =================================================================
  console.log("➡️  Performing initial configuration...");

  // 1. ParticipationNFT的ownership转移给governance合约
  console.log("Setting ownership of ParticipationNFT to Governance...");
  const tx1 = await participationNFT.write.transferOwnership([governance.address]);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log("✅ Ownership transferred.");

  // 2. GovToken设置governance合约为minter (注意：合约中函数名为setMinner，这是拼写错误)
  console.log("Setting Governance as a minter for GovToken...");
  const tx2 = await govToken.write.setMinner([governance.address, true]);
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log("✅ GovToken minter set.");

  // 3. RewardToken设置lottery合约为minter (注意：合约中函数名为setMinner，这是拼写错误)
  console.log("Setting Lottery as a minter for RewardToken...");
  const tx3 = await rewardToken.write.setMinner([lottery.address, true]);
  await publicClient.waitForTransactionReceipt({ hash: tx3 });
  console.log("✅ RewardToken minter set.");

  // 4. StatusNFT按顺序设置baseURI
  console.log("Setting token URIs for StatusNFT tiers...");
  const statusTiers = [
    { name: "SILVER", id: BigInt(1), uri: process.env.SILVER_BASE_URI! },
    { name: "GOLD", id: BigInt(2), uri: process.env.GOLD_BASE_URI! },
    { name: "DIAMOND", id: BigInt(3), uri: process.env.DIAMOND_BASE_URI! },
    { name: "KING", id: BigInt(4), uri: process.env.KING_BASE_URI! },
  ];

  for (const tier of statusTiers) {
    if (!tier.uri) {
        throw new Error(`${tier.name}_BASE_URI not found in .env file`);
    }
    const tx = await statusNFT.write.setTokenURI([tier.id, tier.uri]);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`✅ Set URI for ${tier.name} tier (ID: ${tier.id})`);
  }
  
  // 保存部署信息
  const contractAddresses = {
    GovToken: govToken.address,
    RewardToken: rewardToken.address,
    ParticipationNFT: participationNFT.address,
    Governance: governance.address,
    Lottery: lottery.address,
    StatusNFT: statusNFT.address
  };
  
  await saveDeploymentInfo(contractAddresses);
  
  console.log("\n----------------------------------------------------");
  console.log("🎉 Deployment and configuration complete! 🎉");
  console.log("----------------------------------------------------");
  console.log("Deployed Contract Addresses:");
  console.log(`- GovToken:         ${govToken.address}`);
  console.log(`- RewardToken:      ${rewardToken.address}`);
  console.log(`- ParticipationNFT: ${participationNFT.address}`);
  console.log(`- Governance:       ${governance.address}`);
  console.log(`- Lottery:          ${lottery.address}`);
  console.log(`- StatusNFT:        ${statusNFT.address}`);
  console.log("----------------------------------------------------");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});