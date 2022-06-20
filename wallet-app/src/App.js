import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect } from "react";

function App() {
  const [walletContract, setWalletContract] = useState(null);
  return (
    <div className="App">
      <button className="metamask">Connect Metamask</button>
      <br />
      <br />
      <br />
      <button className="new-wallet">Create new wallet</button>
      <p>Already have a wallet?</p>
      <input type="text"></input>
      <button className="btn btn-primary">Import</button>
    </div>
  );
}

export default App;
