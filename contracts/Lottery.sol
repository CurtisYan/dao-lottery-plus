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
    
    // 添加参与者列表
    address[] public participants;
    mapping(address => bool) public isParticipant;
   
    uint public rewardAmount = 100;
    constructor(address _rewardToken,address _governance) 
        Ownable(msg.sender){
        rewardToken = RewardToken(_rewardToken);    
        governance = Governance(_governance);
    }

    // 添加参与抽奖函数
    function joinLottery() external {
        require(!isParticipant[msg.sender], "Already joined lottery");
        
        participants.push(msg.sender);
        isParticipant[msg.sender] = true;
    }
    
    // 获取参与者列表
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function drawWinner(uint8 _proposalId) external onlyOwner(){
        require(governance.getProposalFinlized(_proposalId),"Proposal not finalized");
        address[] memory eligibleVoters = governance.getEligibleForLottery(_proposalId);
        require(eligibleVoters.length > 0, "No eligible voters");

        // MVP: 安全性低，可以升级使用chainLink 的随机数
        uint winnerIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp,blockhash(block.number-1)))
        )% eligibleVoters.length;

        address winner = eligibleVoters[winnerIndex];
        _setWinner(_proposalId,winner);
    }

    // pull over push => pull: 用户主动领取，push: 智能合约主动推送
    // 应对DOS攻击，用户主动领取，可以避免被攻击者通过合约调用来抢占奖励
    // 虽然只有一个用户可以领取奖励，但是攻击者可以利用gasPrice来抢占奖励，导致攻击者可以抢占奖励
    function claimReward(uint8 _proposalId) external {
        address winner = _getWinner(_proposalId);
        require(winner == msg.sender, "Not the winner");

        hasClaimed[_proposalId] = true;

        rewardToken.mint(winner,rewardAmount);
        governance.rewardVoter(winner, 11);
    }
    // getter & setter functions
    function setGovernanceContract(address _governance) external onlyOwner {
        governance = Governance(_governance);
    }
    function setRewardToken(address _rewardToken) external onlyOwner {
        rewardToken = RewardToken(_rewardToken);
    }
    function setRewardAmount(uint _rewardAmount) external onlyOwner {
        rewardAmount = _rewardAmount;
    }
    function _setWinner(uint8 _proposalId,address _winner)internal{
        proposalWinner[_proposalId] = _winner;
    }
    function _getWinner(uint8 _proposalId) public view returns(address){
        return proposalWinner[_proposalId];
    }
    function getCliaimed(uint8 _proposalId) external view returns(bool){
        return hasClaimed[_proposalId];
    }
}