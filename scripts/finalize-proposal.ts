import hre from "hardhat";
import "dotenv/config";

async function main() {
  console.log("🚀 开始完成提案...");

  const publicClient = await hre.viem.getPublicClient();

  // 获取部署者账户（管理员）
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`管理员账户: ${deployer.account.address}`);
  console.log("----------------------------------------------------");

  // 获取合约实例
  const governance = await hre.viem.getContractAt("Governance", "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9");
  const participationNFT = await hre.viem.getContractAt("ParticipationNFT", "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0");
  
  // 获取当前提案数量
  const proposalCount = await governance.read.proposalCount();
  console.log(`当前提案数量: ${proposalCount}`);
  
  if (proposalCount === 0n) {
    console.log("没有可完成的提案");
    return;
  }
  
  // 获取提案详情
  const proposalId = 1; // 假设完成第一个提案
  const proposal = await governance.read.getProposal([proposalId]);
  console.log("\n提案详情:");
  console.log(`- 描述: ${proposal[0]}`);
  console.log(`- 提案人: ${proposal[1]}`);
  console.log(`- 赞成票数: ${proposal[2]}`);
  console.log(`- 反对票数: ${proposal[3]}`);
  console.log(`- 是否通过: ${proposal[4]}`);
  console.log(`- 是否已完成: ${proposal[5]}`);
  console.log(`- 截止时间: ${new Date(Number(proposal[6]) * 1000).toLocaleString()}`);
  
  // 检查提案是否已经完成
  if (proposal[5]) {
    console.log("提案已经完成");
    return;
  }
  
  // 获取当前区块时间
  const currentBlock = await publicClient.getBlock();
  const currentTime = Number(currentBlock.timestamp);
  const deadlineTime = Number(proposal[6]);
  
  console.log(`\n当前时间: ${new Date(currentTime * 1000).toLocaleString()}`);
  console.log(`截止时间: ${new Date(deadlineTime * 1000).toLocaleString()}`);
  
  // 如果当前时间小于截止时间，需要快进时间
  if (currentTime < deadlineTime) {
    const timeToAdvance = deadlineTime - currentTime + 10; // 多加10秒以确保超过
    console.log(`\n需要快进时间 ${timeToAdvance} 秒...`);
    
    // 使用 Hardhat 的时间操作功能快进时间
    await hre.network.provider.send("evm_increaseTime", [timeToAdvance]);
    await hre.network.provider.send("evm_mine"); // 挖一个新区块
    
    // 获取新的区块时间
    const newBlock = await publicClient.getBlock();
    console.log(`快进后的时间: ${new Date(Number(newBlock.timestamp) * 1000).toLocaleString()}`);
  }
  
  // 完成提案
  console.log("\n正在完成提案...");
  const tx = await governance.write.finalizeProposal([proposalId]);
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log(`✅ 提案已完成！`);
  
  // 获取更新后的提案详情
  const updatedProposal = await governance.read.getProposal([proposalId]);
  console.log("\n更新后的提案详情:");
  console.log(`- 是否通过: ${updatedProposal[4]}`);
  console.log(`- 是否已完成: ${updatedProposal[5]}`);
  
  // 获取符合条件的参与者
  const eligibleVoters = await governance.read.getEligibleForLottery([proposalId]);
  console.log(`\n符合条件的参与者数量: ${eligibleVoters.length}`);
  if (eligibleVoters.length > 0) {
    console.log(`参与者地址: ${eligibleVoters.join(", ")}`);
    
    // 检查参与者是否获得了 NFT
    for (const voter of eligibleVoters) {
      const balance = await participationNFT.read.balanceOf([voter]);
      console.log(`${voter} 的参与 NFT 数量: ${balance}`);
    }
  }

  console.log("\n----------------------------------------------------");
  console.log("🎉 提案完成！");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});