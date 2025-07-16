import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import ChainDashboard from "./ui/chain/ChainDashboard";
import "./index.css";

import Chain from "./ui/chain/id/Chain";
import DeployContract from "./ui/chain/id/DeployContract";
import Contract from "./ui/chain/id/contract/Contract";
import Wallet from "./ui/wallet/Wallet";
import Account from "./ui/account/Account";

function AppContent() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const origin = params.get("origin");

  return (
    <div className="app">

      <nav className="mb-8 flex gap-4 justify-center p-2">
        {origin && (
          <a
            href={decodeURIComponent(origin)}
            className="text-blue-600 hover:underline p-2 m-2"
          >
            ← Back
          </a>
        )}
        <Link
          to="/"
          className="text-blue-600 hover:underline p-2 m-2"
        >
          Home
        </Link>
        <Link
          to="/account"
          className="text-blue-600 hover:underline p-2 m-2"
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
  );
}

export function App() {
  return (
    <BrowserRouter basename="/">
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
