import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChainDashboard from "./ui/chain/ChainDashboard";
import "./index.css";

import Chain from "./ui/chain/id/Chain";
import DeployContract from "./ui/chain/id/DeployContract";
import Contract from "./ui/chain/id/contract/Contract";
import Wallet from "./ui/wallet/Wallet";
import Account from "./ui/account/Account";
import { Sidebar } from "./ui/components/ui/sidebar";

function AppContent() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top app bar for mobile */}
        <header className="lg:hidden bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Chain Service</h1>
            <Sidebar />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Routes>
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/account" element={<Account />} />
            <Route path="/" element={<ChainDashboard />} />
            <Route path="/chain/:id" element={<Chain />} />
            <Route path="/chain/:chainId/contract/:address" element={<Contract />} />
            <Route path="/chain/:id/add" element={<DeployContract />} />
          </Routes>
        </main>
      </div>
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
