const { ethers, waffle } = require("hardhat");
const chai = require("chai");
const should = chai.should();
const provider = waffle.provider;
const SharedWallet = require("../wallet-app/src/artifacts/contracts/SharedWallet.sol/SharedWallet.json");
const { expect } = require("chai");

describe("WalletCreator", () => {
  var creator, contract;
  var owner, addr1, addr2, addr;
  before(async () => {
    [owner, addr1, addr2, ...addr] = await ethers.getSigners();
    var WalletCreator = await ethers.getContractFactory("WalletCreator");
    creator = await WalletCreator.deploy();
    await creator.deployed();
  });

  it("should allow anyone to create a wallet with ownership transferred to msg.sender and emits an event", async () => {
    await expect(creator.createWallet()).to.emit(creator, "WalletCreated");
    var wallets = await creator.returnUserWallets(owner.address);
    contract = new ethers.Contract(wallets[0], SharedWallet.abi, owner);
    expect(contract.address).to.equal(wallets[0]);
    expect(await contract.owner()).to.equal(owner.address);
  });

  describe("SharedWallet", () => {
    it("should allow anyone to deposit ether in contract and emits an event on deposit", async () => {
      const options = { value: ethers.utils.parseEther("0.1") };
      // await expect(contract.connect(addr1).deposit(options)).to.emit(
      //   contract,
      //   "Deposit"
      // );
      const signer = provider.getSigner(0);
      await expect(
        signer.sendTransaction({
          from: signer.address,
          to: contract.address,
          value: options.value,
        })
      ).to.emit(contract, "Deposit");

      var balance = await provider.getBalance(contract.address);
      expect(balance).to.equal(options.value);
    });

    it("should allow owner to add beneficiary", async () => {
      amount = ethers.utils.parseEther("0.01");
      await expect(contract.connect(addr1).addOwner(addr2.address, amount)).to
        .be.reverted;
      var tx = await contract.addOwner(addr2.address, amount);
      await tx.wait();
      expect(await contract.approvedOwner(addr2.address)).to.equal(amount);
    });

    it("should allow beneficiary to withdraw funds from contract", async () => {
      initApprovedLimit = await contract.approvedOwner(addr2.address);
      initContractBalance = await provider.getBalance(contract.address);
      initBalance = await provider.getBalance(addr2.address);
      amount = ethers.utils.parseEther("0.005");
      var tx = await contract.connect(addr2).withdraw(amount);
      await tx.wait();

      expect(await contract.approvedOwner(addr2.address)).to.equal(
        initApprovedLimit.sub(amount)
      );
      balance = await provider.getBalance(addr2.address);
      console.log(balance);

      expect(balance.sub(initBalance)).to.be.within(
        ethers.utils.parseEther("0.0048"),
        ethers.utils.parseEther("0.005")
      );
      contractBalance = await provider.getBalance(contract.address);
      expect(initContractBalance.sub(contractBalance)).to.equal(
        ethers.utils.parseEther("0.005")
      );
    });

    it("should allow beneficiary to transfer funds from contract", async () => {
      initApprovedLimit = await contract.approvedOwner(addr2.address);
      initContractBalance = await provider.getBalance(contract.address);
      initBalance = await provider.getBalance(addr1.address);
      amount = ethers.utils.parseEther("0.002");
      var tx = await contract.connect(addr2).transfer(addr1.address, amount);

      await tx.wait();
      expect(await contract.approvedOwner(addr2.address)).to.equal(
        initApprovedLimit.sub(amount)
      );
      balance = await provider.getBalance(addr1.address);
      console.log(balance);

      expect(balance.sub(initBalance)).to.be.equal(
        ethers.utils.parseEther("0.002")
      );
      contractBalance = await provider.getBalance(contract.address);
      expect(initContractBalance.sub(contractBalance)).to.equal(
        ethers.utils.parseEther("0.002")
      );
    });

    it("should not allow non  beneficiary address to spend funds from contract", async () => {
      await expect(
        contract.connect(addr1).withdraw(ethers.utils.parseEther("0.002"))
      ).to.be.reverted;
      await expect(
        contract.connect(addr1).transfer(ethers.utils.parseEther("0.002")),
        addr2.address
      ).to.be.reverted;
    });

    it("should not allow beneficiary to spend more than the limit", async () => {
      await expect(
        contract.connect(addr2).withdraw(ethers.utils.parseEther("0.004"))
      ).to.be.reverted;
      await expect(
        contract
          .connect(addr2)
          .transfer(addr1.address, ethers.utils.parseEther("0.004"))
      ).to.be.reverted;
    });

    it("should allow owner  to  increase spend limit of beneficiary", async () => {
      initLimit = await contract.approvedOwner(addr2.address);
      var tx = await contract.increaseUserSpendLimit(
        addr2.address,
        ethers.utils.parseEther("0.002")
      );
      await tx.wait();
      updatedLimit = await contract.approvedOwner(addr2.address);
      expect(updatedLimit.sub(initLimit)).to.equal(
        ethers.utils.parseEther("0.002")
      );
    });

    it("should not allow to spend funds more than the contract balance", async () => {
      await expect(contract.withdraw(ethers.utils.parseEther("0.5"))).to.be
        .reverted;
    });

    it("should allow owner to remove beneficiary", async () => {
      expect(await contract.approvedOwner(addr2.address)).to.not.equal(
        ethers.utils.parseEther("0")
      );
      var tx = await contract.removeOwner(addr2.address);
      await tx.wait();
      expect(await contract.approvedOwner(addr2.address)).to.equal(
        ethers.utils.parseEther("0")
      );
    });

    it("should not put a spend limit on owner", async () => {
      initContractBalance = await provider.getBalance(contract.address);
      initBalance = await provider.getBalance(owner.address);

      var amt = ethers.utils.formatEther(initContractBalance.toString());

      var tx = await contract.withdraw(ethers.utils.parseEther(amt));
      await tx.wait();

      balance = await provider.getBalance(owner.address);
      console.log(balance);

      expect(balance.sub(initBalance)).to.be.within(
        ethers.utils.parseEther("0.09"),
        ethers.utils.parseEther("0.1")
      );
      contractBalance = await provider.getBalance(contract.address);
      expect(contractBalance).to.equal(ethers.utils.parseEther("0"));
    });
  });
});
