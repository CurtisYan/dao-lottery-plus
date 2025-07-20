// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ParticipationNFT is ERC721, Ownable {
    string public baseTokenURI;
    uint256 private _nextTokenId;

    constructor(string memory _baseTokenURI) 
        ERC721("Participation NFT", "PNFT") 
        Ownable(msg.sender){
        baseTokenURI = _baseTokenURI;
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
    
    // 重写此函数以返回统一的元数据URI
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
    
    // 允许owner更新URI
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseTokenURI = _newBaseURI;
    }
}