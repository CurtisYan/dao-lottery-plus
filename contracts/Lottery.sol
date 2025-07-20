// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RewardToken.sol";
import "./Governance.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is Ownable{
    RewardToken public rewardToken;
    Governance public governance;

    mapping(uint => address) public proposalWinner;
    mapping(uint => bool) public hasClaimed;
    mapping(uint => uint) public proposalPool; // 每个提案的奖池金额
    
    // 奖池分配比例 - 重新设计
    uint public constant REWARD_RATIO = 80; // 80% 转换为RWD给中奖者
    uint public constant BURN_RATIO = 20; // 20% 销毁GOV，减少通胀
    
    constructor(address _rewardToken,address _governance) 
        Ownable(msg.sender){
        rewardToken = RewardToken(_rewardToken);    
        governance = Governance(_governance);
    }

    // 更新奖池金额（由Governance合约调用）
    function updatePool(uint8 _proposalId, uint _amount) external {
        require(msg.sender == address(governance), "Only governance can update pool");
        proposalPool[_proposalId] = _amount;
    }

    function drawWinner(uint8 _proposalId) external onlyOwner(){
        require(governance.getProposalFinlized(_proposalId),"Proposal not finalized");
        address[] memory eligibleVoters = governance.getEligibleForLottery(_proposalId);
        require(eligibleVoters.length > 0, "No eligible voters");

        // 使用更安全的随机数生成（建议后续升级为Chainlink VRF）
        uint winnerIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, blockhash(block.number-1), eligibleVoters.length))
        ) % eligibleVoters.length;

        address winner = eligibleVoters[winnerIndex];
        _setWinner(_proposalId, winner);
        
        // 分配奖池
        _distributePool(_proposalId);
    }

    // 分配奖池 - 重新设计
    function _distributePool(uint8 _proposalId) internal {
        uint poolAmount = proposalPool[_proposalId];
        if (poolAmount == 0) return;
        
        // 80% 转换为RWD给中奖者
        uint rewardAmount = (poolAmount * REWARD_RATIO) / 100;
        address winner = _getWinner(_proposalId);
        rewardToken.mint(winner, rewardAmount);
        
        // 20% 销毁GOV，减少通胀压力
        uint burnAmount = (poolAmount * BURN_RATIO) / 100;
        // 注意：这里GOV已经被burnFrom消耗，所以不需要额外销毁
        // 销毁逻辑已经在Governance合约的voteProposal中实现
    }

    // 领取奖励（包含GOV奖励）
    function claimReward(uint8 _proposalId) external {
        address winner = _getWinner(_proposalId);
        require(winner == msg.sender, "Not the winner");
        require(!hasClaimed[_proposalId], "Already claimed");

        hasClaimed[_proposalId] = true;

        // 发放GOV奖励
        governance.rewardVoter(winner, 11);
    }

    // getter & setter functions
    function setGovernanceContract(address _governance) external onlyOwner {
        governance = Governance(_governance);
    }
    
    function setRewardToken(address _rewardToken) external onlyOwner {
        rewardToken = RewardToken(_rewardToken);
    }
    
    function _setWinner(uint8 _proposalId,address _winner) internal {
        proposalWinner[_proposalId] = _winner;
    }
    
    function _getWinner(uint8 _proposalId) public view returns(address){
        return proposalWinner[_proposalId];
    }
    
    function getClaimed(uint8 _proposalId) external view returns(bool){
        return hasClaimed[_proposalId];
    }
    
    function getPoolAmount(uint8 _proposalId) external view returns(uint) {
        return proposalPool[_proposalId];
    }
}