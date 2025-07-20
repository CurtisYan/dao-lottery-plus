// scripts/lottery-draw.ts
import hre from "hardhat";
import "dotenv/config";
import { formatEther } from "viem";

async function main() {
  console.log("🚀 开始抽奖...");

  const publicClient = await hre.viem.getPublicClient();

  // 获取部署者账户（管理员）
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`管理员账户: ${deployer.account.address}`);
  console.log("----------------------------------------------------");

  // 获取合约实例
  const lottery = await hre.viem.getContractAt("Lottery", "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9");
  const rewardToken = await hre.viem.getContractAt("RewardToken", "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");
  const governance = await hre.viem.getContractAt("Governance", "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9");
  
  // 获取当前奖励金额
  const rewardAmount = await lottery.read.rewardAmount();
  console.log(`当前奖励金额: ${formatEther(rewardAmount)} RewardToken`);
  
  // 使用已完成的提案
  const proposalId = 1; // 使用我们刚刚完成的提案
  
  // 检查提案是否已完成
  const isFinalized = await governance.read.getProposalFinlized([proposalId]);
  console.log(`提案 ${proposalId} 是否已完成: ${isFinalized}`);
  
  if (!isFinalized) {
    console.log("提案尚未完成，无法进行抽奖");
    return;
  }
  
  // 获取符合条件的参与者
  const eligibleVoters = await governance.read.getEligibleForLottery([proposalId]);
  console.log(`\n符合条件的参与者数量: ${eligibleVoters.length}`);
  
  if (eligibleVoters.length === 0) {
    console.log("没有符合条件的参与者，无法进行抽奖");
    return;
  }
  
  console.log(`参与者地址: ${eligibleVoters.join(", ")}`);
  
  // 检查是否已经有获奖者
  const winner = await lottery.read._getWinner([proposalId]);
  if (winner !== "0x0000000000000000000000000000000000000000") {
    console.log(`\n提案 ${proposalId} 已经有获奖者: ${winner}`);
    
    // 检查是否已领取奖励
    const hasClaimed = await lottery.read.getCliaimed([proposalId]);
    console.log(`是否已领取奖励: ${hasClaimed}`);
    
    if (!hasClaimed) {
      console.log("\n可以领取奖励，尝试领取...");
      // 这里可以添加领取奖励的代码
    }
    
    return;
  }
  
  // 进行抽奖
  console.log("\n进行抽奖...");
  const tx = await lottery.write.drawWinner([proposalId]);
  await publicClient.waitForTransactionReceipt({ hash: tx });
  
  // 获取抽奖结果
  const drawnWinner = await lottery.read._getWinner([proposalId]);
  console.log(`\n🎉 抽奖结果:`);
  console.log(`- 获奖者: ${drawnWinner}`);
  console.log(`- 奖励金额: ${formatEther(rewardAmount)} RewardToken`);
  
  // 让获奖者领取奖励
  console.log("\n让获奖者领取奖励...");
  
  // 获取测试账户
  const [, testWallet] = await hre.viem.getWalletClients();
  
  // 如果测试账户是获奖者，则领取奖励
  if (drawnWinner.toLowerCase() === testWallet.account.address.toLowerCase()) {
    console.log("测试账户是获奖者，领取奖励...");
    
    // 领取奖励前检查余额
    const balanceBefore = await rewardToken.read.balanceOf([testWallet.account.address]);
    console.log(`领取前 RewardToken 余额: ${formatEther(balanceBefore)}`);
    
    const tx2 = await lottery.write.claimReward(
      [proposalId],
      { account: testWallet.account }
    );
    await publicClient.waitForTransactionReceipt({ hash: tx2 });
    
    // 领取奖励后检查余额
    const balanceAfter = await rewardToken.read.balanceOf([testWallet.account.address]);
    console.log(`领取后 RewardToken 余额: ${formatEther(balanceAfter)}`);
    console.log(`增加的余额: ${formatEther(balanceAfter - balanceBefore)}`);
  } else {
    console.log("测试账户不是获奖者，无法领取奖励");
  }

  console.log("\n----------------------------------------------------");
  console.log("🎉 抽奖完成！");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 