import hre from "hardhat";
import "dotenv/config";

async function main() {
  console.log("🚀 开始设置投票门槛为10个GOV...");

  // 从环境变量获取Governance合约地址
  const GOVERNANCE_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || "0x1a6e113cf3abd20650662f76bc163ac2d43a9347";
  
  console.log("📋 Governance合约地址:", GOVERNANCE_ADDRESS);

  try {
    // 使用公共客户端直接调用合约
    const publicClient = await hre.viem.getPublicClient();
    const walletClient = await hre.viem.getWalletClients();
    
    if (!walletClient || walletClient.length === 0) {
      console.error("❌ 错误: 未找到钱包客户端");
      return;
    }

    // 先检查当前账户是否为管理员
    const account = walletClient[0].account;
    console.log("🔑 使用账户:", account.address);
    
    // 检查管理员权限
    const isAdmin = await publicClient.readContract({
      address: GOVERNANCE_ADDRESS as `0x${string}`,
      abi: [
        {
          "inputs": [{"name": "", "type": "address"}],
          "name": "isAdmin",
          "outputs": [{"name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: 'isAdmin',
      args: [account.address],
    });
    
    if (!isAdmin) {
      console.error("❌ 错误: 当前账户没有管理员权限，无法设置门槛");
      return;
    }

    // 获取当前门槛
    const currentThreshold = await publicClient.readContract({
      address: GOVERNANCE_ADDRESS as `0x${string}`,
      abi: [
        {
          "inputs": [],
          "name": "THRESHOLD",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: 'THRESHOLD',
    });
    
    console.log("📊 当前投票门槛:", currentThreshold.toString(), "GOV");

    // 设置新门槛为10个GOV
    const newThreshold = BigInt(10);
    console.log("🎯 设置新门槛为:", newThreshold.toString(), "GOV");

    // 调用setTHRESHOLD函数
    console.log("⏳ 发送交易...");
    const hash = await walletClient[0].writeContract({
      address: GOVERNANCE_ADDRESS as `0x${string}`,
      abi: [
        {
          "inputs": [{"name": "_threshold", "type": "uint256"}],
          "name": "setTHRESHOLD",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'setTHRESHOLD',
      args: [newThreshold],
    });
    
    console.log("📝 交易哈希:", hash);

    // 等待交易确认
    console.log("⏳ 等待交易确认...");
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ 交易已确认！");

    // 验证新门槛
    const updatedThreshold = await publicClient.readContract({
      address: GOVERNANCE_ADDRESS as `0x${string}`,
      abi: [
        {
          "inputs": [],
          "name": "THRESHOLD",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: 'THRESHOLD',
    });
    
    console.log("📊 更新后的投票门槛:", updatedThreshold.toString(), "GOV");

    if (updatedThreshold.toString() === newThreshold.toString()) {
      console.log("🎉 投票门槛设置成功！现在用户只需要10个GOV就可以参与投票了！");
    } else {
      console.log("❌ 投票门槛设置失败！");
    }

  } catch (error) {
    console.error("❌ 设置门槛时出错:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 