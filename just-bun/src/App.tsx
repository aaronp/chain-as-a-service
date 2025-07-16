import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ChainDashboard from "./ui/chain/ChainDashboard";
import "./index.css";

import Chain from "./ui/chain/id/Chain";
import DeployContract from "./ui/chain/id/DeployContract";
import Contract from "./ui/chain/id/contract/Contract";
import Wallet from "./ui/wallet/Wallet";
import Account from "./ui/account/Account";

export function App() {


  return (
    <BrowserRouter basename="/">
      <div className="app">
        <nav className="mb-8 flex gap-4 justify-center">
          <Link
            to="/"
            className="text-blue-600 hover:underline"
          >
            Home
          </Link>
          <Link
            to="/account"
            className="text-blue-600 hover:underline"
          >
            Account
          </Link>
        </nav>
        <Routes>
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/account" element={<Account />} />
          <Route path="/" element={<ChainDashboard />} />
          <Route path="/chain/:id" element={<Chain />} />
          <Route path="/chain/:chainId/contract/:address" element={<Contract />} />
          <Route path="/chain/:id/add" element={<DeployContract />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
