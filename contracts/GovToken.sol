// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract GovToken is ERC20,ERC20Burnable,Ownable{

    mapping(address=>bool) public isMinter;

    modifier onlyMinter(){
        require(isMinter[msg.sender] == true);
        _;
    }

    constructor(uint _initialSupply) 
            ERC20("GovToken","RWD")
            Ownable(msg.sender){
        isMinter[msg.sender] = true;
        _mint(msg.sender, _initialSupply * 10 ** decimals());
    }

    // 禁用普通转账
    function transfer(address _to, uint256 _amount) 
        public 
        override 
        returns (bool) 
    {
        revert("Transfers are disabled");
    }

    // 禁用授权转账
    function transferFrom(address _from, address _to, uint256 _amount) 
        public 
        override 
        returns (bool) 
    {
        revert("Transfers are disabled");
    }

    function mint(address to, uint256 amount) public onlyMinter(){
        _mint(to, amount);
    }

    function setMinner(address _addr,bool _isMinner)external onlyOwner(){
        isMinter[_addr] = _isMinner;
    }

}