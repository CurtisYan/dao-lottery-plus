// scripts/mint-tokens.ts
import hre from "hardhat";
import "dotenv/config";
import { formatEther, parseEther } from "viem";

async function main() {
  console.log("🚀 开始铸造代币...");

  const publicClient = await hre.viem.getPublicClient();

  // 获取部署者账户和测试账户
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`使用账户: ${deployer.account.address}`);
  console.log(`账户余额: ${formatEther(await publicClient.getBalance({ address: deployer.account.address }))} ETH`);
  console.log("----------------------------------------------------");

  // 测试账户地址 (Hardhat 默认账户)
  const testAccount = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // 第二个账户
  console.log(`测试账户: ${testAccount}`);

  // 获取合约实例
  const govToken = await hre.viem.getContractAt("GovToken", "0x5fbdb2315678afecb367f032d93f642f64180aa3");
  const rewardToken = await hre.viem.getContractAt("RewardToken", "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");

  // 铸造代币
  const mintAmount = parseEther("10000"); // 铸造 10,000 代币
  
  console.log("铸造 GovToken...");
  const tx1 = await govToken.write.mint([testAccount, mintAmount]);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log(`✅ 已铸造 ${formatEther(mintAmount)} GovToken 到 ${testAccount}`);
  
  console.log("铸造 RewardToken...");
  const tx2 = await rewardToken.write.mint([testAccount, mintAmount]);
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log(`✅ 已铸造 ${formatEther(mintAmount)} RewardToken 到 ${testAccount}`);

  // 检查余额
  const govBalance = await govToken.read.balanceOf([testAccount]);
  const rewardBalance = await rewardToken.read.balanceOf([testAccount]);
  
  console.log("\n----------------------------------------------------");
  console.log(`测试账户 ${testAccount} 的余额:`);
  console.log(`- GovToken: ${formatEther(govBalance)}`);
  console.log(`- RewardToken: ${formatEther(rewardBalance)}`);
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 