import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ChainsPage from "./ui/ChainsPage";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";

export function App() {
  return (
    <BrowserRouter basename="/ui">
      <div className="app">
        <div className="logo-container">
          <img src={logo} alt="Bun Logo" className="logo bun-logo" />
          <img src={reactLogo} alt="React Logo" className="logo react-logo" />
        </div>
        <h1>Chain as a Service</h1>
        <nav className="mb-8 flex gap-4 justify-center">
          <Link to="/chain" className="text-blue-600 hover:underline">Chains</Link>
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        </nav>
        <Routes>
          <Route path="/chain" element={<ChainsPage />} />
          <Route path="/" element={
            <p>
              Edit <code>src/App.tsx</code> and save to test HMR
              {/* Optionally add <APITester /> here if you want it on the home page */}
            </p>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
