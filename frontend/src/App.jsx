import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PortfolioProvider } from "./context/PortfolioContext";
import Dashboard from "./components/Dashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function AppContent() {
  const { isLoggedIn, logout } = useAuth();
  const [page, setPage] = useState("login");

  if (!isLoggedIn) {
    return page === "login"
      ? <LoginPage onSwitch={() => setPage("register")} />
      : <RegisterPage onSwitch={() => setPage("login")} />;
  }

  return (
    <PortfolioProvider>
      <div className="app">
        <nav><h1>TradersHub</h1><button onClick={logout}>Logout</button></nav>
        <Dashboard />
      </div>
    </PortfolioProvider>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
