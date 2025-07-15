import { APITester } from "./APITester";

function AppBar() {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center px-4 bg-red-50">
        <span className="text-4xl font-bold tracking-tight">Chain as a Service</span>
      </div>
    </header>
  );
}

export function App() {
  return (
    <>
      <AppBar />
      <div className="app">
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
