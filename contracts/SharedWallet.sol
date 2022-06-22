// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";


contract SharedWallet is Ownable, ReentrancyGuard{
    
    mapping(address => uint) public approvedOwner;
    constructor(){}

    modifier validOwner() {
        require(_msgSender() == owner() || approvedOwner[msg.sender] > 0, "User not approved");
        _;
    }

    event Deposit(address _sender, uint _amount);
    event Withdraw(address _recipient, uint _amount);
    event Transfer(address _sender, address _recipient, uint _amount);

    function addOwner(address _beneficiary, uint _amount) external onlyOwner{
        require(approvedOwner[_beneficiary] == 0 && _beneficiary != owner(), "Address already added as a beneficiary.");
        approvedOwner[_beneficiary] = _amount; 
    }

    function removeOwner(address _beneficiary) external onlyOwner{
        require(approvedOwner[_beneficiary] > 0, "Address not a beneficiary.");
        require(_beneficiary != owner(), "Owner's address");
        approvedOwner[_beneficiary] = 0;
    }

    function increaseUserSpendLimit(address _beneficiary, uint _amount) external onlyOwner {
        require(approvedOwner[_beneficiary] > 0, "Address not a beneficiary.");
        require(_beneficiary!= owner(), "Owner's address");
        approvedOwner[_beneficiary] += _amount;
    }

    function deposit() external payable {
      emit Deposit(_msgSender(), msg.value);
    }

    function withdraw(uint _amount) external nonReentrant validOwner {
        require(address(this).balance >= _amount, "Insufficient funds.");
         
        if(_msgSender() != owner()){
            
            require(approvedOwner[_msgSender()] >= _amount, "User withdraw limit exceeded.");
            
        }
        
        (bool res,) = payable(_msgSender()).call{value: _amount}("");
       
        require(res, "Error transferring funds. Try Again.");
        if(_msgSender() != owner()){
            approvedOwner[_msgSender()] -= _amount;
        }
        emit Withdraw(_msgSender(), _amount);
    }

    function transfer(address _to, uint _amount) external nonReentrant validOwner {
        require(address(this).balance >= _amount, "Insufficient funds.");
        if(_msgSender() != owner()){
            require(approvedOwner[_msgSender()] >= _amount, "User withdraw limit exceeded.");
        }
        (bool res,) = payable(_to).call{value: _amount}("");
        require(res, "Error transferring funds. Try Again.");
        if(_msgSender() != owner()){
            approvedOwner[_msgSender()] -= _amount;
        }
        emit Transfer(_msgSender(), _to, _amount);
    }

  receive() external payable{
    emit Deposit(_msgSender(), msg.value);
  }
}