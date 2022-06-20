const { ethers, waffle } = require("hardhat");
const chai = require("chai");
const should = require("chai").should();
const provider = waffle.provider;

const { expect } = require("chai");

describe("SharedWallet", () => {
  var contract;
  var owner, addr1, addr2, addr;
  before(async () => {
    [owner, addr1, addr2, ...addr] = await ethers.getSigners();
    var SharedWalletContract = await ethers.getContractFactory("SharedWallet");
    contract = await SharedWalletContract.deploy();
    await contract.deployed();
  });

  it("should allow anyone to deposit ether in contract and emits an event on deposit", async () => {
    const options = { value: ethers.utils.parseEther("100") };
    await expect(contract.connect(addr1).deposit(options)).to.emit(
      contract,
      "Deposit"
    );

    var balance = await provider.getBalance(contract.address);
    expect(balance).to.equal(options.value);
  });

  it("should allow owner to add beneficiary", async () => {
    amount = ethers.utils.parseEther("10");
    await expect(contract.connect(addr1).addOwner(addr2.address, amount)).to.be
      .reverted;
    var tx = await contract.addOwner(addr2.address, amount);
    await tx.wait();
    expect(await contract.approvedOwner(addr2.address)).to.equal(amount);
  });

  it("should allow beneficiary to withdraw funds from contract", async () => {
    initApprovedLimit = await contract.approvedOwner(addr2.address);
    initContractBalance = await provider.getBalance(contract.address);
    initBalance = await provider.getBalance(addr2.address);
    amount = ethers.utils.parseEther("5");
    var tx = await contract.connect(addr2).withdraw(amount);
    await tx.wait();

    expect(await contract.approvedOwner(addr2.address)).to.equal(
      initApprovedLimit.sub(amount)
    );
    balance = await provider.getBalance(addr2.address);
    console.log(balance);

    expect(balance.sub(initBalance)).to.be.within(
      ethers.utils.parseEther("4.9"),
      ethers.utils.parseEther("5")
    );
    contractBalance = await provider.getBalance(contract.address);
    expect(initContractBalance.sub(contractBalance)).to.equal(
      ethers.utils.parseEther("5")
    );
  });

  it("should allow beneficiary to transfer funds from contract", async () => {
    initApprovedLimit = await contract.approvedOwner(addr2.address);
    initContractBalance = await provider.getBalance(contract.address);
    initBalance = await provider.getBalance(addr1.address);
    amount = ethers.utils.parseEther("2");
    var tx = await contract.connect(addr2).transfer(addr1.address, amount);

    await tx.wait();
    expect(await contract.approvedOwner(addr2.address)).to.equal(
      initApprovedLimit.sub(amount)
    );
    balance = await provider.getBalance(addr1.address);
    console.log(balance);

    expect(balance.sub(initBalance)).to.be.equal(ethers.utils.parseEther("2"));
    contractBalance = await provider.getBalance(contract.address);
    expect(initContractBalance.sub(contractBalance)).to.equal(
      ethers.utils.parseEther("2")
    );
  });

  it("should not allow non  beneficiary address to spend funds from contract", async () => {
    await expect(contract.connect(addr1).withdraw(ethers.utils.parseEther("2")))
      .to.be.reverted;
    await expect(
      contract.connect(addr1).transfer(ethers.utils.parseEther("2")),
      addr2.address
    ).to.be.reverted;
  });

  it("should not allow beneficiary to spend more than the limit", async () => {
    await expect(contract.connect(addr2).withdraw(ethers.utils.parseEther("4")))
      .to.be.reverted;
    await expect(
      contract
        .connect(addr2)
        .transfer(addr1.address, ethers.utils.parseEther("4"))
    ).to.be.reverted;
  });

  it("should allow owner  to  increase spend limit of beneficiary", async () => {
    initLimit = await contract.approvedOwner(addr2.address);
    var tx = await contract.increaseUserSpendLimit(
      addr2.address,
      ethers.utils.parseEther("2")
    );
    await tx.wait();
    updatedLimit = await contract.approvedOwner(addr2.address);
    expect(updatedLimit.sub(initLimit)).to.equal(ethers.utils.parseEther("2"));
  });

  it("should not allow to spend funds more than the contract balance", async () => {
    await expect(contract.withdraw(ethers.utils.parseEther("100"))).to.be
      .reverted;
  });
});
