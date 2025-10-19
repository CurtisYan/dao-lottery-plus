// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GovToken.sol";
import "./ParticipationNFT.sol";
import "./Lottery.sol";
import "./StatusNFT.sol";

contract Governance is Ownable {

    struct Proposal{
        string description;
        address proposer;
        uint yesVotes;
        uint noVote;
        bool pass;
        bool finalized;
        bool removed;
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
    StatusNFT public statusNFT;

    struct RemovalVote {
        string reason;
        address initiator;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        bool exists;
        mapping(address => bool) hasVoted;
    }

    mapping(uint8 => RemovalVote) private removalVotes;

    uint256 public constant HIGH_TIER_MIN_GOV = 200 * 1e18;
    uint256 public constant LOW_TIER_MIN_GOV = 500 * 1e18;
    uint256 public constant MIN_REMOVAL_VOTE_DURATION = 1 hours;

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
    event RemovalVoteInitiated(uint8 indexed proposalId, address indexed initiator, uint256 deadline, string reason);
    event RemovalVoteCast(uint8 indexed proposalId, address indexed voter, bool indexed support);
    event RemovalVoteFinalized(uint8 indexed proposalId, bool removed, uint256 yesVotes, uint256 noVotes, uint256 slashedAmount);

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
        require(!proposal.removed, "Proposal removed");
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
        require(!proposal.removed, "Proposal removed");
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

    function initiateRemovalVote(uint8 _proposalId, string calldata _reason, uint256 _duration) external {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        require(bytes(_reason).length > 0, "Removal reason required");
        require(_duration >= MIN_REMOVAL_VOTE_DURATION, "Duration too short");
        require(address(statusNFT) != address(0), "Status NFT not set");

        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.removed, "Proposal already removed");

        RemovalVote storage removal = removalVotes[_proposalId];
        require(!removal.exists, "Removal vote already active");

        (bool eligible,,,) = _removalEligibility(msg.sender);
        require(eligible, "Not eligible for removal vote");

        removal.reason = _reason;
        removal.initiator = msg.sender;
        removal.deadline = block.timestamp + _duration;
        removal.yesVotes = 0;
        removal.noVotes = 0;
        removal.executed = false;
        removal.exists = true;

        emit RemovalVoteInitiated(_proposalId, msg.sender, removal.deadline, _reason);
    }

    function voteOnRemoval(uint8 _proposalId, bool _support) external {
        RemovalVote storage removal = removalVotes[_proposalId];
        require(removal.exists, "Removal vote not active");
        require(!removal.executed, "Removal vote finalized");
        require(block.timestamp < removal.deadline, "Voting period ended");

        (bool eligible,,,) = _removalEligibility(msg.sender);
        require(eligible, "Not eligible for removal vote");
        require(!removal.hasVoted[msg.sender], "Already voted");

        removal.hasVoted[msg.sender] = true;
        if (_support) {
            removal.yesVotes += 1;
        } else {
            removal.noVotes += 1;
        }

        emit RemovalVoteCast(_proposalId, msg.sender, _support);
    }

    function finalizeRemovalVote(uint8 _proposalId) external {
        RemovalVote storage removal = removalVotes[_proposalId];
        require(removal.exists, "Removal vote not active");
        require(!removal.executed, "Removal vote finalized");
        require(block.timestamp >= removal.deadline, "Voting period ongoing");

        removal.executed = true;

        Proposal storage proposal = proposals[_proposalId];
        uint256 slashedAmount = 0;
        bool removed = false;

        if (removal.yesVotes > removal.noVotes && !proposal.removed) {
            proposal.removed = true;
            proposal.finalized = true;
            proposal.pass = false;
            removed = true;

            address proposer = proposal.proposer;
            if (proposer != address(0)) {
                uint256 balance = govToken.balanceOf(proposer);
                slashedAmount = balance / 2;
                if (slashedAmount > 0) {
                    govToken.slash(proposer, slashedAmount);
                }
            }
        }

        emit RemovalVoteFinalized(_proposalId, removed, removal.yesVotes, removal.noVotes, slashedAmount);
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

    function setStatusNFT(address _statusNFT) external onlyOwner {
        statusNFT = StatusNFT(_statusNFT);
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

    function getRemovalVote(uint8 _proposalId) external view returns (
        bool exists,
        string memory reason,
        address initiator,
        uint256 deadline,
        uint256 yesVotes,
        uint256 noVotes,
        bool executed
    ) {
        RemovalVote storage removal = removalVotes[_proposalId];
        if (!removal.exists) {
            return (false, "", address(0), 0, 0, 0, false);
        }

        return (
            true,
            removal.reason,
            removal.initiator,
            removal.deadline,
            removal.yesVotes,
            removal.noVotes,
            removal.executed
        );
    }

    function hasRemovalVoted(uint8 _proposalId, address _user) external view returns (bool) {
        return removalVotes[_proposalId].hasVoted[_user];
    }

    function getRemovalEligibility(address account) external view returns (
        bool eligible,
        bool qualifiesHighTier,
        bool qualifiesLowTier,
        uint256 balance
    ) {
        return _removalEligibility(account);
    }

    function _removalEligibility(address account) internal view returns (
        bool eligible,
        bool qualifiesHighTier,
        bool qualifiesLowTier,
        uint256 balance
    ) {
        balance = govToken.balanceOf(account);

        if (address(statusNFT) == address(0)) {
            return (false, false, false, balance);
        }

        uint256 diamondTierId = statusNFT.DIAMOND_TIER_ID();
        uint256 kingTierId = statusNFT.KING_TIER_ID();
        uint256 goldTierId = statusNFT.GOLD_TIER_ID();
        uint256 silverTierId = statusNFT.SILVER_TIER_ID();

        qualifiesHighTier = statusNFT.balanceOf(account, diamondTierId) > 0 || statusNFT.balanceOf(account, kingTierId) > 0;
        qualifiesLowTier = statusNFT.balanceOf(account, goldTierId) > 0 || statusNFT.balanceOf(account, silverTierId) > 0;

        if (qualifiesHighTier && balance >= HIGH_TIER_MIN_GOV) {
            eligible = true;
        } else if (qualifiesLowTier && balance >= LOW_TIER_MIN_GOV) {
            eligible = true;
        }
    }
    function getProposal(uint8 _proposalId) external view returns(
        string memory description,
        address proposer,
        uint yesVotes,
        uint noVote,
        bool pass,
        bool finalized,
        uint deadline,
        bool removed
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
            proposal.deadline,
            proposal.removed
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