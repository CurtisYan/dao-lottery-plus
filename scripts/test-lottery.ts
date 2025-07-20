// scripts/test-lottery.ts
import hre from "hardhat";
import "dotenv/config";
import { formatEther, parseEther } from "viem";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🧪 Testing Lottery Mechanism...");

  const publicClient = await hre.viem.getPublicClient();
  const [deployer, user1, user2, user3] = await hre.viem.getWalletClients();

  // 读取最新部署信息
  const deploymentPath = path.join(__dirname, "../deployments/latest.json");
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contracts = deploymentData.contracts;

  console.log("📋 Loaded contract addresses:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  // 获取合约实例
  const govToken = await hre.viem.getContractAt("GovToken", contracts.GovToken);
  const rewardToken = await hre.viem.getContractAt("RewardToken", contracts.RewardToken);
  const governance = await hre.viem.getContractAt("Governance", contracts.Governance);
  const lottery = await hre.viem.getContractAt("Lottery", contracts.Lottery);
  const participationNFT = await hre.viem.getContractAt("ParticipationNFT", contracts.ParticipationNFT);

  console.log("\n----------------------------------------------------");
  console.log("🎯 Testing Lottery Mechanism Step by Step");
  console.log("----------------------------------------------------");

  // 1. 检查初始状态
  console.log("1️⃣ Checking initial state...");
  const initialGovBalance = await govToken.read.balanceOf([deployer.account.address]);
  const initialRewardBalance = await rewardToken.read.balanceOf([deployer.account.address]);
  console.log(`   Deployer GOV balance: ${formatEther(initialGovBalance)}`);
  console.log(`   Deployer RWD balance: ${formatEther(initialRewardBalance)}`);

  // 2. 给测试用户分配GOV代币
  console.log("\n2️⃣ Distributing GOV tokens to test users...");
  const testAmount = parseEther("1000");
  
  for (const user of [user1, user2, user3]) {
    const tx = await govToken.write.transfer([user.account.address, testAmount]);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`   Sent ${formatEther(testAmount)} GOV to ${user.account.address}`);
  }

  // 3. 创建提案
  console.log("\n3️⃣ Creating a test proposal...");
  const proposalDesc = "Test proposal for lottery mechanism";
  const proposalDuration = BigInt(300); // 5 minutes
  
  const createTx = await governance.write.createProposal([proposalDesc, proposalDuration], {
    account: user1.account.address
  });
  await publicClient.waitForTransactionReceipt({ hash: createTx });
  console.log("   ✅ Proposal created successfully");

  // 4. 用户投票
  console.log("\n4️⃣ Users voting on the proposal...");
  const votes = [
    { user: user1, choice: true },
    { user: user2, choice: true },
    { user: user3, choice: false }
  ];

  for (const vote of votes) {
    const voteTx = await governance.write.voteProposal([1, vote.choice], {
      account: vote.user.account.address
    });
    await publicClient.waitForTransactionReceipt({ hash: voteTx });
    console.log(`   User ${vote.user.account.address} voted: ${vote.choice ? 'YES' : 'NO'}`);
  }

  // 5. 等待投票期结束并最终化提案
  console.log("\n5️⃣ Waiting for voting period to end...");
  await new Promise(resolve => setTimeout(resolve, 6000)); // 等待6秒

  console.log("   Finalizing proposal...");
  const finalizeTx = await governance.write.finalizeProposal([1]);
  await publicClient.waitForTransactionReceipt({ hash: finalizeTx });
  console.log("   ✅ Proposal finalized");

  // 6. 检查参与NFT发放
  console.log("\n6️⃣ Checking Participation NFT distribution...");
  const eligibleVoters = await governance.read.getEligibleForLottery([1]);
  console.log(`   Eligible voters: ${eligibleVoters.length}`);
  
  for (const voter of eligibleVoters) {
    const nftBalance = await participationNFT.read.balanceOf([voter]);
    console.log(`   Voter ${voter}: ${nftBalance} Participation NFTs`);
  }

  // 7. 检查奖池金额
  console.log("\n7️⃣ Checking lottery pool...");
  const poolAmount = await lottery.read.getPoolAmount([BigInt(1)]);
  console.log(`   Pool amount: ${poolAmount} GOV tokens`);

  // 8. 抽奖
  console.log("\n8️⃣ Drawing winner...");
  const drawTx = await lottery.write.drawWinner([1]);
  await publicClient.waitForTransactionReceipt({ hash: drawTx });
  
  const winner = await lottery.read._getWinner([1]);
  console.log(`   🎉 Winner: ${winner}`);

  // 9. 中奖者领取奖励
  console.log("\n9️⃣ Winner claiming rewards...");
  const winnerClient = eligibleVoters.includes(user1.account.address) ? user1 : 
                      eligibleVoters.includes(user2.account.address) ? user2 : user3;
  
  const claimTx = await lottery.write.claimReward([1], {
    account: winnerClient.account.address
  });
  await publicClient.waitForTransactionReceipt({ hash: claimTx });
  console.log("   ✅ Rewards claimed successfully");

  // 10. 检查最终状态
  console.log("\n🔟 Checking final state...");
  const finalGovBalance = await govToken.read.balanceOf([winner]);
  const finalRewardBalance = await rewardToken.read.balanceOf([winner]);
  
  console.log(`   Winner GOV balance: ${formatEther(finalGovBalance)}`);
  console.log(`   Winner RWD balance: ${formatEther(finalRewardBalance)}`);
  console.log(`   Note: 20% of GOV tokens were burned to reduce inflation`);

  console.log("\n----------------------------------------------------");
  console.log("🎉 Lottery mechanism test completed successfully! 🎉");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 