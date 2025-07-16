// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GovToken.sol"; // 确保GovToken接口可用

contract StatusNFT is ERC1155, Ownable {
    // 引入GovToken合约，用于查询余额
    GovToken public immutable govToken;

    // 定义不同等级的Token ID
    uint256 public constant SILVER_TIER_ID = 1;
    uint256 public constant GOLD_TIER_ID = 2;
    uint256 public constant DIAMOND_TIER_ID = 3;
    uint256 public constant KING_TIER_ID = 4;

    // 定义每个等级所需的GovToken数量
    uint256 public constant SILVER_REQUIREMENT = 500;
    uint256 public constant GOLD_REQUIREMENT = 1000;
    uint256 public constant DIAMOND_REQUIREMENT = 2000;
    uint256 public constant KING_REQUIREMENT = 5000;

    // 存储每个Token ID对应的metadata URI
    mapping(uint256 => string) private _tokenURIs;

    // 记录用户已领取的最高等级，防止重复领取或降级领取
    mapping(address => uint256) public highestTierClaimed;

    constructor(address _govTokenAddress) 
        ERC1155("") 
        Ownable(msg.sender){ // URI设为空字符串，因为我们会重写uri函数
        govToken = GovToken(_govTokenAddress);
    }
    
    /**
     * @dev 核心函数：用户根据持仓量认领NFT
     */
    function claimStatusNFT() external {
        uint256 balance = govToken.balanceOf(msg.sender);
        uint256 currentTier = highestTierClaimed[msg.sender];

        // 从大到小
        if (balance > KING_REQUIREMENT && currentTier < KING_TIER_ID){
            _mint(msg.sender, KING_TIER_ID, 1, "");
            highestTierClaimed[msg.sender] = KING_TIER_ID;
        }else if(balance > DIAMOND_REQUIREMENT && currentTier < DIAMOND_TIER_ID){
            _mint(msg.sender, DIAMOND_TIER_ID, 1, "");
            highestTierClaimed[msg.sender] = DIAMOND_TIER_ID;
        }else if(balance > GOLD_REQUIREMENT && currentTier < GOLD_TIER_ID){
            _mint(msg.sender, GOLD_TIER_ID, 1, ""); 
            highestTierClaimed[msg.sender] = GOLD_TIER_ID;
        }else if (balance > SILVER_REQUIREMENT && currentTier < SILVER_TIER_ID){
            _mint(msg.sender, SILVER_TIER_ID, 1, "");
            highestTierClaimed[msg.sender] = SILVER_TIER_ID;
        }else {
            revert("Not eligible for any new tier or already claimed the highest possible tier");
        }
    }

    /**
     * @dev 重写uri函数，返回每个Token ID对应的元数据URI
     */
    function uri(uint256 _tokenId) public view override returns (string memory) {
        return _tokenURIs[_tokenId];
    }
    
    /**
     * @dev 设置每个等级NFT的元数据URI
     */
    function setTokenURI(uint256 _tokenId, string memory _uri) external onlyOwner {
        _tokenURIs[_tokenId] = _uri;
    }
}