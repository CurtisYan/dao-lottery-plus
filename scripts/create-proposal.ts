// scripts/create-proposal.ts
import hre from "hardhat";
import "dotenv/config";
import { parseEther } from "viem";

async function main() {
  console.log("🚀 开始创建治理提案...");

  const publicClient = await hre.viem.getPublicClient();

  // 获取部署者账户和测试账户
  const [deployer, testWallet] = await hre.viem.getWalletClients();
  console.log(`部署者账户: ${deployer.account.address}`);
  console.log(`测试账户: ${testWallet.account.address}`);
  console.log("----------------------------------------------------");

  // 获取合约实例
  const govToken = await hre.viem.getContractAt("GovToken", "0x5fbdb2315678afecb367f032d93f642f64180aa3");
  const governance = await hre.viem.getContractAt("Governance", "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9");
  
  // 获取当前 FEE
  const fee = await governance.read.FEE();
  console.log(`提案创建费用: ${fee} GovToken`);
  
  // 授权 Governance 合约使用 GovToken
  console.log("授权 GovToken...");
  const approveAmount = parseEther("100"); // 授权 100 GovToken
  const tx1 = await govToken.write.approve(
    [governance.address, approveAmount],
    { account: testWallet.account }
  );
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log(`✅ 已授权 Governance 合约使用 GovToken`);
  
  // 创建提案
  console.log("\n创建提案...");
  const proposalDescription = "这是一个测试提案：是否应该增加代币奖励？";
  const duration = 3600; // 1小时
  
  const tx2 = await governance.write.createProposal(
    [proposalDescription, duration],
    { account: testWallet.account }
  );
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log(`✅ 提案已创建`);

  // 获取提案数量
  const proposalCount = await governance.read.proposalCount();
  console.log(`当前提案数量: ${proposalCount}`);

  // 获取最新提案详情
  const proposal = await governance.read.getProposal([proposalCount]);
  console.log("\n提案详情:");
  console.log(`- 描述: ${proposal[0]}`);
  console.log(`- 提案人: ${proposal[1]}`);
  console.log(`- 赞成票数: ${proposal[2]}`);
  console.log(`- 反对票数: ${proposal[3]}`);
  console.log(`- 是否通过: ${proposal[4]}`);
  console.log(`- 是否已完成: ${proposal[5]}`);
  console.log(`- 截止时间: ${new Date(Number(proposal[6]) * 1000).toLocaleString()}`);

  console.log("\n----------------------------------------------------");
  console.log("🎉 提案创建完成！");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});