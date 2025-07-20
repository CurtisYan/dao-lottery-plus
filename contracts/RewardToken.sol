// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken is ERC20,Ownable{

    mapping(address=>bool) public isMinter;

    modifier onlyMinter(){
        require(isMinter[msg.sender] == true);
        _;
    }

    constructor(uint _initialSupply) 
            ERC20("RewardToken","RWD")
            Ownable(msg.sender){
        isMinter[msg.sender] = true;
        _mint(msg.sender, _initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyMinter(){
        _mint(to, amount);
    }

    function setMinner(address _addr,bool _isMinner)external onlyOwner(){
        isMinter[_addr] = _isMinner;
    }

}