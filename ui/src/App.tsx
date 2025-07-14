import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ChainDashboard from "./ui/ChainDashboard";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import Chain from "./ui/Chain";
import DeployContract from "./ui/DeployContract";

export function App() {
  return (
    <BrowserRouter basename="/">
      <div className="app">
        <nav className="mb-8 flex gap-4 justify-center">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        </nav>
        <Routes>
          <Route path="/" element={<ChainDashboard />} />
          <Route path="/chain/:id" element={<Chain />} />
          <Route path="/chain/:id/add" element={<DeployContract />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
