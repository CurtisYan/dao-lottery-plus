// scripts/mint-nft.ts
import hre from "hardhat";
import "dotenv/config";
import { formatEther, parseEther } from "viem";

async function main() {
  console.log("🚀 开始准备 NFT 认领...");

  const publicClient = await hre.viem.getPublicClient();

  // 获取部署者账户和测试账户
  const [deployer, testWallet] = await hre.viem.getWalletClients();
  console.log(`部署者账户: ${deployer.account.address}`);
  console.log(`测试账户: ${testWallet.account.address}`);
  console.log("----------------------------------------------------");

  // 获取合约实例
  const govToken = await hre.viem.getContractAt("GovToken", "0x5fbdb2315678afecb367f032d93f642f64180aa3");
  const statusNFT = await hre.viem.getContractAt("StatusNFT", "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707");

  // 先给测试账户足够的 GovToken 以满足 KING 等级要求
  const kingRequirement = 5001n * 10n ** 18n; // 超过 KING_REQUIREMENT (5000)
  console.log(`铸造 ${formatEther(kingRequirement)} GovToken 到测试账户...`);
  const tx1 = await govToken.write.mint([testWallet.account.address, kingRequirement]);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  
  // 检查余额
  const govBalance = await govToken.read.balanceOf([testWallet.account.address]);
  console.log(`✅ 测试账户 GovToken 余额: ${formatEther(govBalance)}`);

  // 使用测试账户认领 NFT
  console.log("\n使用测试账户认领状态 NFT...");
  const tx2 = await statusNFT.write.claimStatusNFT({
    account: testWallet.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log(`✅ 测试账户已成功认领状态 NFT`);

  // 检查认领的等级
  const claimedTier = await statusNFT.read.highestTierClaimed([testWallet.account.address]);
  console.log(`✅ 测试账户认领的最高等级: ${claimedTier}`);

  console.log("\n----------------------------------------------------");
  console.log("🎉 NFT 认领完成！");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 