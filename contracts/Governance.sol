// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GovToken.sol";
import "./ParticipationNFT.sol";
import "./Lottery.sol";

contract Governance is Ownable {

    struct Proposal{
        string description;
        address proposer;
        uint yesVotes;
        uint noVote;
        bool pass;
        bool finalized;
        uint deadline;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteChoice;
        address [] voters;
    }

    struct TaskConfig {
        uint256 reward;
        uint256 cooldown;
        bool active;
        bool repeatable;
    }

    mapping(uint8 => Proposal) public proposals;
    uint8 public proposalCount;
    mapping(uint => address[]) public elgibleForLottery;
    mapping (address=>bool) isAdmin;
    mapping(address => uint256) public memberSince;

    mapping(bytes32 => TaskConfig) public tasks;
    mapping(address => mapping(bytes32 => uint256)) public lastTaskCompletion;

    GovToken public govToken;
    ParticipationNFT public participationNFT;
    Lottery public lottery;

    uint public FEE;
    uint public THRESHOLD;
    uint public totalVotes; // 总投票数，用于计算奖池

    constructor(address _govToken,address _participationNFT)
        Ownable(msg.sender){
        isAdmin[msg.sender] = true;
        govToken = GovToken(_govToken);
        participationNFT = ParticipationNFT(_participationNFT);
        FEE = 10;
        THRESHOLD = 10;
    }

    event create(address indexed proposer, uint8 indexed proposalId);
    event vote(address indexed voter, uint8 indexed proposalId, bool indexed choice);
    event finalize(uint8 indexed proposalId, bool indexed result);
    event execute(uint8 indexed proposalId);
    event claimGOV(address indexed winner, uint8 indexed proposalId);
    event TaskConfigured(bytes32 indexed taskId, uint256 reward, uint256 cooldown, bool active, bool repeatable);
    event TaskCompleted(address indexed user, bytes32 indexed taskId, uint256 reward);

    modifier onlyAdmin(){
        require(isAdmin[msg.sender] == true,"Only admin can do this");
        _;
    }

    function createProposal(string memory _desc,uint _duration) external {
        require(govToken.balanceOf(msg.sender) > FEE, "Not enough GOV");
        require(_duration > 60,"Duration to short");

        govToken.burnFrom(msg.sender, FEE);

        // 记录首次成为DAO成员的时间
        if (memberSince[msg.sender] == 0) {
            memberSince[msg.sender] = block.timestamp;
        }

        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.description = _desc;
        proposal.proposer = msg.sender;
        proposal.deadline = block.timestamp + _duration;

        emit create(msg.sender, proposalCount);
    }

    function voteProposal(uint8 _proposalId, bool _choice) external {
        uint balance = govToken.balanceOf(msg.sender);
        require(balance > THRESHOLD,"You didn't meet the voting threshold");
        // avoid from contract swiping
        require(msg.sender == tx.origin, "Only tx.origin can vote");
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.deadline > block.timestamp, "Voting period has ended");
        require(!proposal.hasVoted[msg.sender], "You have already voted");   
        require(!proposal.finalized, "Proposal has been finalized");
        require(govToken.balanceOf(msg.sender) > 1, "Not enough GOV tokens");
        
        govToken.burnFrom(msg.sender, 1);
        totalVotes++; // 增加总投票数

        // 记录首次成为DAO成员的时间
        if (memberSince[msg.sender] == 0) {
            memberSince[msg.sender] = block.timestamp;
        }

        proposal.hasVoted[msg.sender] = true;
        proposal.voteChoice[msg.sender] = _choice;
        proposal.voters.push(msg.sender);
        if(_choice){
            proposal.yesVotes++;
        }else{
            proposal.noVote++;
        }

        emit vote(msg.sender, _proposalId, _choice);
    }

    function finalizeProposal(uint8 _proposalId) external onlyAdmin(){
        Proposal storage proposal = proposals[_proposalId];
        require(_proposalId <= proposalCount, "Invalid proposal ID");
        require(proposal.deadline < block.timestamp, "Voting period has not ended");
        require(!proposal.finalized, "Proposal has already been finalized");
        proposal.pass = proposal.yesVotes > proposal.noVote;
        
        uint correctVotes = 0;
        for(uint i = 0; i < proposal.voters.length; i++){
            address voter = proposal.voters[i];
            bool choice = proposal.voteChoice[voter];
            if(choice == proposal.pass){
                elgibleForLottery[_proposalId].push(voter);
                correctVotes++;
                // 发放参与NFT给voter
                participationNFT.safeMint(voter);
            }
        }
        
        // 每个正确投票贡献1个GOV到奖池 + 固定100GOV
        if(address(lottery) != address(0)) {
            lottery.updatePool(_proposalId, correctVotes + 100);
        }
        
        proposal.finalized = true;
        emit finalize(_proposalId, proposal.pass);
    }

    function rewardVoter(address _voter, uint8 _amount) external {
        require(msg.sender == address(lottery), "Only lottery can reward voters");
        govToken.mint(_voter, _amount);
    }

    function setTask(bytes32 _taskId, uint256 _reward, uint256 _cooldown, bool _active, bool _repeatable) external onlyAdmin {
        require(_taskId != bytes32(0), "Invalid task id");
        if (_active) {
            require(_reward > 0, "Reward must be set");
        }

        tasks[_taskId] = TaskConfig({
            reward: _reward,
            cooldown: _cooldown,
            active: _active,
            repeatable: _repeatable
        });

        emit TaskConfigured(_taskId, _reward, _cooldown, _active, _repeatable);
    }

    function completeTask(bytes32 _taskId) external {
        TaskConfig memory task = tasks[_taskId];
        require(task.active, "Task not active");
        require(task.reward > 0, "Task reward not set");

        uint256 lastCompleted = lastTaskCompletion[msg.sender][_taskId];

        if (task.repeatable) {
            if (task.cooldown > 0) {
                require(block.timestamp >= lastCompleted + task.cooldown, "Task cooldown not finished");
            } else {
                require(block.timestamp > lastCompleted, "Task already completed");
            }
        } else {
            require(lastCompleted == 0, "Task already completed");
        }

        lastTaskCompletion[msg.sender][_taskId] = block.timestamp;
        govToken.mint(msg.sender, task.reward);

        emit TaskCompleted(msg.sender, _taskId, task.reward);
    }

    function getTask(bytes32 _taskId) external view returns (uint256 reward, uint256 cooldown, bool active, bool repeatable) {
        TaskConfig memory task = tasks[_taskId];
        return (task.reward, task.cooldown, task.active, task.repeatable);
    }

    function getTaskLastCompletion(address _user, bytes32 _taskId) external view returns (uint256) {
        return lastTaskCompletion[_user][_taskId];
    }

    // 设置Lottery合约地址
    function setLotteryContract(address _lottery) external onlyOwner {
        lottery = Lottery(_lottery);
    }

    // getter and setter
    function setAdmin(address _addr,bool _isAdmin)public onlyOwner(){
        isAdmin[_addr] = _isAdmin;
    }
    function setFEE(uint _fee)public onlyAdmin{
        FEE = _fee;
    }
    // 只有管理员能修改抽奖至少持有多少 GOV 代币
    function setTHRESHOLD(uint _threshold)public onlyAdmin{
        THRESHOLD = _threshold;
    }
    function getProposal(uint8 _proposalId) external view returns(
        string memory description,
        address proposer,
        uint yesVotes,
        uint noVote,
        bool pass,
        bool finalized,
        uint deadline
    ){
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.description,
            proposal.proposer,
            proposal.yesVotes,
            proposal.noVote,
            proposal.pass,
            proposal.finalized,
            proposal.deadline
        );
    }
    function hasUserVoted(uint8 _proposalId, address _user) external view returns (bool) {
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[_proposalId].hasVoted[_user];
    }
    function getVoteChoice(uint8 _proposalId, address _user) external view returns (bool) {
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        require(proposals[_proposalId].hasVoted[_user], "User has not voted");
        return proposals[_proposalId].voteChoice[_user];
    }
    function getProposalCount() external view returns(uint8){
        return proposalCount;
    }
    function getProposalFinlized(uint8 _proposalId)external view returns(bool){
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[_proposalId].finalized;
    }
    function getEligibleForLottery(uint8 _proposalId) external view returns(address[] memory){
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        require( proposals[_proposalId].finalized, "Proposal did not finalized");
        return elgibleForLottery[_proposalId];
    }
    
    function getTotalVotes() external view returns(uint) {
        return totalVotes;
    }

    function getMemberSince(address user) external view returns (uint256) {
        return memberSince[user];
    }
}