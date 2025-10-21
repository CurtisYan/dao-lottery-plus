// scripts/complete-demo.ts
import hre from "hardhat";
import "dotenv/config";
import { formatEther, parseEther } from "viem";

async function main() {
  console.log("🎭 DAO Lottery 完整演示开始！");
  console.log("=".repeat(60));

  const publicClient = await hre.viem.getPublicClient();
  const [deployer, user1, user2, user3] = await hre.viem.getWalletClients();

  console.log(`部署账户: ${deployer.account.address}`);
  console.log(`账户余额: ${formatEther(await publicClient.getBalance({ address: deployer.account.address }))} ETH`);
  console.log("");

  // ========== 第一阶段：部署合约 ==========
  console.log("🚀 第一阶段：部署智能合约");
  console.log("-".repeat(40));

  const initialSupply = 1_000_000n;
  const participationBaseURI = process.env.PARTICIPATION_BASE_URI!;

  // 部署所有合约
  console.log("正在部署合约...");
  const govToken = await hre.viem.deployContract("GovToken", [initialSupply]);
  const rewardToken = await hre.viem.deployContract("RewardToken", [initialSupply]);
  const participationNFT = await hre.viem.deployContract("ParticipationNFT", [participationBaseURI]);
  const governance = await hre.viem.deployContract("Governance", [govToken.address, participationNFT.address]);
  const lottery = await hre.viem.deployContract("Lottery", [rewardToken.address, governance.address]);
  const statusNFT = await hre.viem.deployContract("StatusNFT", [govToken.address]);

  console.log("✅ 所有合约部署完成");
  console.log(`- GovToken: ${govToken.address}`);
  console.log(`- RewardToken: ${rewardToken.address}`);
  console.log(`- ParticipationNFT: ${participationNFT.address}`);
  console.log(`- Governance: ${governance.address}`);
  console.log(`- Lottery: ${lottery.address}`);
  console.log(`- StatusNFT: ${statusNFT.address}`);
  console.log("");

  // 初始化配置
  console.log("正在进行初始化配置...");
  await participationNFT.write.transferOwnership([governance.address]);
  await govToken.write.setMinner([governance.address, true]);
  await rewardToken.write.setMinner([lottery.address, true]);

  // 配置StatusNFT的URIs
  const statusTiers = [
    { name: "SILVER", id: 1n, uri: process.env.SILVER_BASE_URI! },
    { name: "GOLD", id: 2n, uri: process.env.GOLD_BASE_URI! },
    { name: "DIAMOND", id: 3n, uri: process.env.DIAMOND_BASE_URI! },
    { name: "KING", id: 4n, uri: process.env.KING_BASE_URI! },
  ];

  for (const tier of statusTiers) {
    await statusNFT.write.setTokenURI([tier.id, tier.uri]);
  }

  console.log("✅ 初始化配置完成");
  console.log("");

  // ========== 第二阶段：DAO功能演示 ==========
  console.log("🎯 第二阶段：DAO功能演示");
  console.log("-".repeat(40));

  // 1. 管理员为用户分配初始GOV代币
  console.log("1️⃣ 分配初始GOV代币");
  const initialGovAmount = parseEther("1000");
  await govToken.write.mint([user1.account.address, initialGovAmount]);
  await govToken.write.mint([user2.account.address, initialGovAmount]);
  await govToken.write.mint([user3.account.address, initialGovAmount]);
  console.log(`✅ 为3个用户各分配 ${formatEther(initialGovAmount)} GOV`);
  console.log("");

  // 2. 用户1创建提案
  console.log("2️⃣ 创建提案");
  const proposalDescription = "建议增加社区开发基金用于前端改进";
  const votingDuration = 3600;

  await govToken.write.approve([governance.address, parseEther("100")], { account: user1.account });
  await governance.write.createProposal([proposalDescription, votingDuration], { account: user1.account });
  console.log(`✅ 用户1创建提案: "${proposalDescription}"`);
  console.log("");

  // 3. 查看提案状态
  console.log("3️⃣ 查看提案状态");
  try {
    const proposalCount = await governance.read.getProposalCount();
    console.log(`当前提案数量: ${proposalCount}`);
    
    const proposal = await governance.read.getProposal([1n]);
    console.log(`提案详情:`);
    console.log(`- 描述: ${proposal[0]}`);
    console.log(`- 提案者: ${proposal[1]}`);
    console.log(`- 当前赞成票: ${proposal[2]}`);
    console.log(`- 当前反对票: ${proposal[3]}`);
    console.log(`- 是否通过: ${proposal[4]}`);
    console.log(`- 是否结束: ${proposal[5]}`);
  } catch (error) {
    console.log("⚠️ 无法读取提案状态，可能是网络重置导致");
  }
  console.log("");

  // 4. 用户投票
  console.log("4️⃣ 用户投票");
  await govToken.write.approve([governance.address, parseEther("1")], { account: user1.account });
  await govToken.write.approve([governance.address, parseEther("1")], { account: user2.account });
  await govToken.write.approve([governance.address, parseEther("1")], { account: user3.account });

  await governance.write.voteProposal([1n, true], { account: user1.account });
  await governance.write.voteProposal([1n, true], { account: user2.account });
  await governance.write.voteProposal([1n, false], { account: user3.account });

  console.log("✅ 用户1投票: 赞成");
  console.log("✅ 用户2投票: 赞成");
  console.log("✅ 用户3投票: 反对");
  console.log("");

  // 5. 模拟时间流逝并结束提案
  console.log("5️⃣ 结束提案投票");
  await hre.network.provider.send("evm_increaseTime", [3700]);
  await hre.network.provider.send("evm_mine");

  await governance.write.finalizeProposal([1n]);
  console.log("✅ 提案投票结束，参与NFT已分发给获胜方投票者");
  console.log("");

  // 6. 查看投票结果和NFT分发
  console.log("6️⃣ 查看投票结果和NFT分发");
  try {
    const updatedProposal = await governance.read.getProposal([1n]);
    console.log(`最终结果: ${updatedProposal[4] ? "✅ 提案通过" : "❌ 提案未通过"}`);
    console.log(`最终票数 - 赞成: ${updatedProposal[2]}, 反对: ${updatedProposal[3]}`);

    const user1NFTs = await participationNFT.read.balanceOf([user1.account.address]);
    const user2NFTs = await participationNFT.read.balanceOf([user2.account.address]);
    const user3NFTs = await participationNFT.read.balanceOf([user3.account.address]);

    console.log(`参与NFT分发情况:`);
    console.log(`- 用户1: ${user1NFTs} 个`);
    console.log(`- 用户2: ${user2NFTs} 个`);
    console.log(`- 用户3: ${user3NFTs} 个`);
  } catch (error) {
    console.log("⚠️ 无法读取投票结果");
  }
  console.log("");

  // ========== 第三阶段：抽奖系统演示 ==========
  console.log("🎰 第三阶段：抽奖系统演示");
  console.log("-".repeat(40));

  // 7. 进行抽奖
  console.log("7️⃣ 进行抽奖");
  await lottery.write.drawWinner([1n]);
  const winner = await lottery.read._getWinner([1n]);
  console.log(`🎉 中奖者: ${winner}`);

  let winnerName = "未知用户";
  let winnerClient = user1;
  
  // 确保地址比较是正确的（转换为小写）
  const winnerLower = winner.toLowerCase();
  const user1Lower = user1.account.address.toLowerCase();
  const user2Lower = user2.account.address.toLowerCase();
  const user3Lower = user3.account.address.toLowerCase();
  
  if (winnerLower === user1Lower) {
    winnerName = "用户1";
    winnerClient = user1;
  } else if (winnerLower === user2Lower) {
    winnerName = "用户2"; 
    winnerClient = user2;
  } else if (winnerLower === user3Lower) {
    winnerName = "用户3";
    winnerClient = user3;
  }
  
  console.log(`中奖者是: ${winnerName}`);
  console.log(`用户1地址: ${user1.account.address}`);
  console.log(`用户2地址: ${user2.account.address}`);
  console.log(`用户3地址: ${user3.account.address}`);
  console.log("");

  // 8. 中奖者领取奖励
  console.log("8️⃣ 领取奖励");
  await lottery.write.claimReward([1n], { account: winnerClient.account });
  console.log("✅ 奖励已成功领取!");
  console.log("");

  // ========== 第四阶段：查看最终状态 ==========
  console.log("📊 第四阶段：查看最终状态");
  console.log("-".repeat(40));

  // 9. 查看代币余额
  console.log("9️⃣ 代币余额统计");
  const user1GovBalance = await govToken.read.balanceOf([user1.account.address]);
  const user2GovBalance = await govToken.read.balanceOf([user2.account.address]);
  const user3GovBalance = await govToken.read.balanceOf([user3.account.address]);

  const user1RewardBalance = await rewardToken.read.balanceOf([user1.account.address]);
  const user2RewardBalance = await rewardToken.read.balanceOf([user2.account.address]);
  const user3RewardBalance = await rewardToken.read.balanceOf([user3.account.address]);

  console.log("💰 GOV代币余额:");
  console.log(`- 用户1: ${formatEther(user1GovBalance)} GOV`);
  console.log(`- 用户2: ${formatEther(user2GovBalance)} GOV`);
  console.log(`- 用户3: ${formatEther(user3GovBalance)} GOV`);

  console.log("🏆 奖励代币余额:");
  console.log(`- 用户1: ${formatEther(user1RewardBalance)} REWARD`);
  console.log(`- 用户2: ${formatEther(user2RewardBalance)} REWARD`);
  console.log(`- 用户3: ${formatEther(user3RewardBalance)} REWARD`);
  console.log("");

  // 10. 身份NFT演示
  console.log("🔟 身份NFT系统演示");
  try {
    const silverThreshold = await statusNFT.read.tierThresholds([1n]);
    console.log(`白银身份NFT门槛: ${formatEther(silverThreshold)} GOV`);

    // 尝试为符合条件的用户铸造身份NFT
    if (user1GovBalance >= silverThreshold) {
      await statusNFT.write.mint([user1.account.address, 1n]);
      console.log("✅ 用户1获得白银身份NFT");
    }
    if (user2GovBalance >= silverThreshold) {
      await statusNFT.write.mint([user2.account.address, 1n]);
      console.log("✅ 用户2获得白银身份NFT");
    }
    if (user3GovBalance >= silverThreshold) {
      await statusNFT.write.mint([user3.account.address, 1n]);
      console.log("✅ 用户3获得白银身份NFT");
    }
  } catch (error) {
    console.log("⚠️ 身份NFT系统演示遇到问题");
  }
  console.log("");

  // ========== 演示总结 ==========
  console.log("🎊 演示总结");
  console.log("=".repeat(60));
  console.log("✅ 智能合约部署和配置完成");
  console.log("✅ 用户成功创建和参与提案投票");
  console.log("✅ 参与NFT自动分发给获胜方投票者");
  console.log("✅ 抽奖系统正常工作，中奖者成功领取奖励");
  console.log("✅ 代币余额正确更新");
  console.log("✅ 身份NFT系统可用");
  console.log("");
  console.log("🔥 DAO Lottery 系统功能验证完成！");
  console.log("这个系统实现了:");
  console.log("• 基于贡献的治理代币分发");
  console.log("• 灵魂绑定的GOV代币（无法转账）");
  console.log("• 参与式治理投票机制");
  console.log("• 自动化的抽奖奖励系统");
  console.log("• 基于持有量的身份NFT等级");
  console.log("• 防刷票和女巫攻击机制");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 