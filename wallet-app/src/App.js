import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import SharedWallet from "./artifacts/contracts/SharedWallet.sol/SharedWallet.json";
import WalletCreator from "./artifacts/contracts/WalletCreator.sol/WalletCreator.json";
import { Button, Title } from '@safe-global/safe-react-components'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'

function App() {
  const [walletCreator, setWalletCreator] = useState(null);
  const [account, setAccount] = useState(null);
  const [address, setAdddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [currWallet, setCurrWallet] = useState(null);
  const [spendLimit, setSpendLimit] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [importedWallet, setImportedWallet] = useState(null);
  const [beneficiary, setBeneficiary] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const { sdk, safe } = useSafeAppsSDK()
  let iface = new ethers.utils.Interface(WalletCreator.abi);

  useEffect(() => {
    if (safe) {
      setAdddress(safe.safeAddress)
    }
    async function initialize() {
      console.log(
        "current wallet: ",
        currWallet ? currWallet.address : "undefined"
      );
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      setProvider(provider);
      // Prompt user for account connections

      var contract = new ethers.Contract(
        "0xF5347bAb35133cf1e5c11F6a058DfD96B4caDDbE",
        WalletCreator.abi,
        provider
      );
      setWalletCreator(contract);
      if (currWallet && address) {
        console.log("here");
        await setWalletBalance();
        var owner = await currWallet.owner();
        if (address === owner) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
          await setLimit();
        }
      }
    }
    initialize();
    console.log("safe: ", safe.safeAddress)
  }, [currWallet, account, address]);

  async function setLimit() {
    var limit = await currWallet.approvedOwner(address);

    setSpendLimit(ethers.utils.formatEther(limit.toString()));
  }

  // const handleWalletConnect = async (event) => {
  //   event.preventDefault();
  //   await connectWallet();
  // };

  // const connectWallet = async () => {
  //   await provider.send("eth_requestAccounts", []);
  //   const signer = provider.getSigner();
  //   const account = await signer.getAddress();
  //   setAccount(signer);
  //   setAdddress(account);
  //   console.log("Account connected", account);
  //   const chainId = 245022926; //Neon Devnet

  //   if (window.ethereum.networkVersion !== chainId) {
  //     try {
  //       await window.ethereum.request({
  //         method: "wallet_switchEthereumChain",
  //         params: [{ chainId: "0xe9ac0ce" }],
  //       });
  //     } catch (err) {
  //       // This error code indicates that the chain has not been added to MetaMask
  //       if (err.code === 4902) {
  //         await window.ethereum.request({
  //           method: "wallet_addEthereumChain",
  //           params: [
  //             {
  //               chainName: "Neon Devnet",
  //               chainId: "0xe9ac0ce",
  //               nativeCurrency: {
  //                 name: "NEON",
  //                 decimals: 18,
  //                 symbol: "NEON",
  //               },
  //               rpcUrls: [
  //                 "https://devnet.neonevm.org",
  //               ],
  //             },
  //           ],
  //         });
  //       }
  //     }
  //   }
  // };

  async function setWalletBalance() {
    var newBalance = await provider.getBalance(currWallet.address);

    setBalance(ethers.utils.formatEther(newBalance.toString()));
  }

  async function createWallet(event) {
    event.preventDefault();
    setLoading(true);
    // var tx = await walletCreator.connect(account).createWallet();
    // await tx.wait();
    var data = iface.encodeFunctionData("createWallet")
    var tx = {
      to: walletCreator.address,
      value: '0',
      data: data
    }
    await submitTx(tx);
    try {
      var wallets = await walletCreator.returnUserWallets(address);
      console.log(wallets);
      var wallet = wallets[wallets.length - 1];
      var contract = new ethers.Contract(wallet, SharedWallet.abi, provider);
      setCurrWallet(contract);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  }

  const handleAnotherWallet = (event) => {
    event.preventDefault();
    setCurrWallet(null);
  };

  const handleImport = async (event) => {
    event.preventDefault();
    try {
      var contract = new ethers.Contract(
        importedWallet,
        SharedWallet.abi,
        provider
      );
      console.log("address: " + contract.address);
      var owner = await contract.owner();
      console.log("owner: " + typeof owner);
      if (owner) setCurrWallet(contract);
      else {
        alert("Invalid Import");
      }
    } catch (error) {
      alert("Invalid Import");

      console.log("error in catch: ", error.message);
    }
  };

  async function addBeneficiary(event) {
    event.preventDefault();
    setLoading(true);
    try {
      var options = { value: ethers.utils.parseEther(amount.toString()) };
      var tx = await currWallet
        .connect(account)
        .addOwner(beneficiary, options.value);
      await tx.wait();
      alert("AddedBeneficiary");
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
    setLoading(false);
  }

  async function removeBeneficiary(event) {
    event.preventDefault();
    setLoading(true);
    try {
      var tx = await currWallet.connect(account).removeOwner(beneficiary);
      await tx.wait();
      alert("RemovedBeneficiary");
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
    setLoading(false);
  }
  async function checkSpendLimit(event) {
    event.preventDefault();
    try {
      var amount = await currWallet.approvedOwner(beneficiary);
      console.log(typeof ethers.utils.formatEther(amount.toString()));

      alert("Spend Limit:" + ethers.utils.formatEther(amount.toString()));
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
  }
  async function increaseSpendLimit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      var options = { value: ethers.utils.parseEther(amount) };
      var tx = await currWallet
        .connect(account)
        .increaseUserSpendLimit(beneficiary, options.value);
      await tx.wait();
      var limit = await currWallet.approvedOwner(beneficiary);
      alert("Increased limit to:" + limit.toString());
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
    setLoading(false);
  }
  async function deposit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      var options = { value: ethers.utils.parseEther(amount) };
      var tx = await currWallet.connect(account).deposit(options);
      await tx.wait();
      await setWalletBalance();
      alert("Deposited!");
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
    setLoading(false);
  }

  async function withdraw(event) {
    event.preventDefault();
    setLoading(true);
    try {
      var options = { value: ethers.utils.parseEther(amount) };
      var tx = await currWallet.connect(account).withdraw(options.value);
      await tx.wait();
      await setWalletBalance();
      await setLimit();
      alert("Withdraw completed! ");
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
    setLoading(false);
  }
  async function transfer(event) {
    event.preventDefault();
    setLoading(true);
    try {
      var options = { value: ethers.utils.parseEther(amount) };
      var tx = await currWallet
        .connect(account)
        .transfer(recipient, options.value);
      await tx.wait();
      await setWalletBalance();
      await setLimit();
      alert(`${amount} Transferred to ${recipient}!`);
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
    setLoading(false);
  }

  const submitTx = useCallback(async (tx) => {
    try {
      const { safeTxHash } = await sdk.txs.send({
        txs: [tx],
      })
      console.log({ safeTxHash })
      const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash)
      console.log({ safeTx })
    } catch (e) {
      console.error(e)
    }
  }, [safe, sdk])

  return (
    <div className="App">
      {loading ? (
        <div>
          <h1>Loading...</h1>
        </div>
      ) : (
        <div>
          {safe ? (
            <div>
              <p>Safe: {safe.safeAddress}</p>
              <br />
              <br />
              <br />
              {currWallet ? (
                <div>
                  <p>Current Wallet: {currWallet.address}</p>
                  <p>Balance: {balance} ETH</p>
                  {isOwner ? (
                    <div>
                      <p>You are the owner of current wallet</p>
                      <input
                        type="text"
                        placeholder="Address"
                        onChange={(event) => setBeneficiary(event.target.value)}
                      ></input>
                      <input
                        type="text"
                        placeholder="Amount"
                        onChange={(event) => setAmount(event.target.value)}
                      ></input>
                      <button onClick={addBeneficiary}>Add beneficiary</button>
                      <button onClick={increaseSpendLimit}>
                        Increase Spend Limit
                      </button>
                      <br />
                      <input
                        type="text"
                        placeholder="Address"
                        onChange={(event) => setBeneficiary(event.target.value)}
                      ></input>
                      <button onClick={checkSpendLimit}>
                        Check spend limit
                      </button>
                      <br />
                      <input
                        type="text"
                        placeholder="Address"
                        onChange={(event) => setBeneficiary(event.target.value)}
                      ></input>
                      <button onClick={removeBeneficiary}>
                        Remove beneficiary
                      </button>
                    </div>
                  ) : (
                    <p>Spend Limit: {spendLimit} ETH</p>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder="Amount"
                      onChange={(event) => setAmount(event.target.value)}
                    ></input>
                    <button onClick={deposit}>Deposit</button>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Amount"
                      onChange={(event) => setAmount(event.target.value)}
                    ></input>
                    <button onClick={withdraw}>Withdraw</button>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Recipient"
                      onChange={(event) => setRecipient(event.target.value)}
                    ></input>
                    <input
                      type="text"
                      placeholder="Amount"
                      onChange={(event) => setAmount(event.target.value)}
                    ></input>
                    <button onClick={transfer}>Transfer</button>
                  </div>
                  <div>
                    <button onClick={handleAnotherWallet}>
                      User another wallet
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button className="new-wallet" onClick={createWallet}>
                    Create new wallet
                  </button>
                  <p>Already have a wallet?</p>
                  <input
                    type="text"
                    onChange={(event) => setImportedWallet(event.target.value)}
                  ></input>
                  <button onClick={handleImport}>Import</button>
                </>
              )}
            </div>
          ) : (
            <button className="metamask">
              Waiting for safe...
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
