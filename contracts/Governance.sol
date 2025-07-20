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

    mapping(uint8 => Proposal) public proposals;
    uint8 public proposalCount;
    mapping(uint => address[]) public elgibleForLottery;
    mapping (address=>bool) isAdmin;
    mapping(address => uint256) public memberSince;

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