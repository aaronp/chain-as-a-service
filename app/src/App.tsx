import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChainDashboard from "./ui/chain/ChainDashboard";
import "./index.css";

import Chain from "./ui/chain/id/Chain";
import DeployContract from "./ui/chain/id/DeployContract";
import Contract from "./ui/chain/id/contract/Contract";
import Wallet from "./ui/wallet/Wallet";
import Account from "./ui/account/Account";
import { Sidebar, ThemeProvider } from "./ui/components/ui/sidebar";
import { AccountProvider } from "./ui/account/AccountContext";
import { cn } from "./lib/utils";

function AppContent() {
  return (
    <AccountProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
    </AccountProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/">
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
