import { expect } from "chai";
import {
  loadFixture,
  mine,
  time,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Lottery", function () {
  async function deployLotteryFixture() {
    const [owner] = await hre.viem.getWalletClients();

    const govToken = await hre.viem.deployContract("GovToken", [1000n]);
    const participationNFT = await hre.viem.deployContract("ParticipationNFT", [
      "ipfs://base-uri/",
    ]);
    const governance = await hre.viem.deployContract("Governance", [
      govToken.address,
      participationNFT.address,
    ]);
    const rewardToken = await hre.viem.deployContract("RewardToken", [0n]);
    const lottery = await hre.viem.deployContract("Lottery", [
      rewardToken.address,
      governance.address,
    ]);

    await participationNFT.write.transferOwnership([governance.address], {
      account: owner.account,
    });
    await govToken.write.setMinner([governance.address, true], {
      account: owner.account,
    });
    await rewardToken.write.setMinner([lottery.address, true], {
      account: owner.account,
    });
    await governance.write.setLotteryContract([lottery.address], {
      account: owner.account,
    });

    const unit = await govToken.read.UNIT();

    await govToken.write.approve([governance.address, 1000n * unit], {
      account: owner.account,
    });

    await governance.write.createProposal(["Test proposal", 3600n], {
      account: owner.account,
    });
    await governance.write.voteProposal([1, true], { account: owner.account });

    await time.increase(3601);
    await mine();

    await governance.write.finalizeProposal([1], { account: owner.account });

    return { lottery, owner };
  }

  it("prevents distributing the pool multiple times", async function () {
    const { lottery, owner } = await loadFixture(deployLotteryFixture);

    const poolBefore = await lottery.read.proposalPool([1]);
    expect(poolBefore).to.be.gt(0n);

    await lottery.write.drawWinner([1], { account: owner.account });

    const poolAfter = await lottery.read.proposalPool([1]);
    expect(poolAfter).to.equal(0n);

    const winner = await lottery.read.proposalWinner([1]);
    expect(winner).to.not.equal(ZERO_ADDRESS);

    const distributed = await lottery.read.poolDistributed([1]);
    expect(distributed).to.equal(true);

    await expect(
      lottery.write.drawWinner([1], { account: owner.account })
    ).to.be.rejectedWith("Winner already drawn");
  });
});
