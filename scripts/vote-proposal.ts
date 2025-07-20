// scripts/vote-proposal.ts
import hre from "hardhat";
import "dotenv/config";
import { parseEther } from "viem";

async function main() {
  console.log("🚀 开始对提案进行投票...");

  const publicClient = await hre.viem.getPublicClient();

  // 获取部署者账户和测试账户
  const [deployer, testWallet] = await hre.viem.getWalletClients();
  console.log(`部署者账户: ${deployer.account.address}`);
  console.log(`测试账户: ${testWallet.account.address}`);
  console.log("----------------------------------------------------");

  // 获取合约实例
  const govToken = await hre.viem.getContractAt("GovToken", "0x5fbdb2315678afecb367f032d93f642f64180aa3");
  const governance = await hre.viem.getContractAt("Governance", "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9");
  
  // 获取当前提案数量
  const proposalCount = await governance.read.proposalCount();
  console.log(`当前提案数量: ${proposalCount}`);
  
  if (proposalCount === 0n) {
    console.log("没有可投票的提案");
    return;
  }
  
  // 获取提案详情
  const proposalId = 1; // 假设投票第一个提案
  const proposal = await governance.read.getProposal([proposalId]);
  console.log("\n提案详情:");
  console.log(`- 描述: ${proposal[0]}`);
  console.log(`- 提案人: ${proposal[1]}`);
  console.log(`- 赞成票数: ${proposal[2]}`);
  console.log(`- 反对票数: ${proposal[3]}`);
  console.log(`- 是否通过: ${proposal[4]}`);
  console.log(`- 是否已完成: ${proposal[5]}`);
  console.log(`- 截止时间: ${new Date(Number(proposal[6]) * 1000).toLocaleString()}`);
  
  // 授权 Governance 合约使用 GovToken
  console.log("\n授权 GovToken...");
  const approveAmount = parseEther("10"); // 授权 10 GovToken
  const tx1 = await govToken.write.approve(
    [governance.address, approveAmount],
    { account: testWallet.account }
  );
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log(`✅ 已授权 Governance 合约使用 GovToken`);
  
  // 投票
  console.log("\n投票中...");
  const voteChoice = true; // true 表示赞成，false 表示反对
  const tx2 = await governance.write.voteProposal(
    [proposalId, voteChoice],
    { account: testWallet.account }
  );
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log(`✅ 投票成功！投票选择: ${voteChoice ? "赞成" : "反对"}`);
  
  // 获取更新后的提案详情
  const updatedProposal = await governance.read.getProposal([proposalId]);
  console.log("\n更新后的提案详情:");
  console.log(`- 赞成票数: ${updatedProposal[2]}`);
  console.log(`- 反对票数: ${updatedProposal[3]}`);

  console.log("\n----------------------------------------------------");
  console.log("🎉 投票完成！");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 