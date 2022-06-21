// SPDX-License-Identifier: MIT 
pragma solidity 0.8.11;

import "./SharedWallet.sol";
contract WalletCreator {

  mapping (address => address[]) public userWallets;
  constructor() {}

  event WalletCreated(address indexed _beneficiary, address _wallet);

  function createWallet() external {
    SharedWallet newWallet = new SharedWallet();
    newWallet.transferOwnership(msg.sender);
    userWallets[msg.sender].push(address(newWallet));
    emit WalletCreated(msg.sender, address(newWallet));
  }
}