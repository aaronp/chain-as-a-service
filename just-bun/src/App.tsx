import { APITester } from "./APITester";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import React from "react";

function AppBar() {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center px-4">
        <span className="text-xl font-bold tracking-tight">Chain as a Service</span>
      </div>
    </header>
  );
}

export function App() {
  return (
    <>
      <AppBar />
      <div className="app">
        <div className="logo-container">
          <img src={logo} alt="Bun Logo" className="logo bun-logo" />
          <img src={reactLogo} alt="React Logo" className="logo react-logo" />
        </div>

        <h1>Bun + React</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <APITester />
      </div>
    </>
  );
}

export default App;
