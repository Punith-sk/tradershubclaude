import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PortfolioProvider } from "./context/PortfolioContext";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OptionsChain from "./components/OptionsChain";
import LandingPage from "./pages/LandingPage";
import WeeklyCompetition from "./components/WeeklyCompetition";

function AppContent() {
  const { isLoggedIn, logout } = useAuth();
  const [page, setPage] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");
  const [showLanding, setShowLanding] = useState(true);

  if (!isLoggedIn && showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!isLoggedIn) {
    return page === "login"
      ? <LoginPage onSwitch={() => setPage("register")} />
      : <RegisterPage onSwitch={() => setPage("login")} />;
  }

  return (
    <PortfolioProvider>
      <div className="app">
        <nav>
          <h1>TradersHub</h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setActivePage("dashboard")}
              style={{
                background: activePage === "dashboard" ? "#f59e0b" : "transparent",
                color: activePage === "dashboard" ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.3rem 0.9rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: activePage === "dashboard" ? "bold" : "normal",
              }}
            >
              Trading
            </button>
            <button
              onClick={() => setActivePage("options")}
              style={{
                background: activePage === "options" ? "#f59e0b" : "transparent",
                color: activePage === "options" ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.3rem 0.9rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: activePage === "options" ? "bold" : "normal",
              }}
            >
              Options
            </button>
            <button
              onClick={() => setActivePage("leaderboard")}
              style={{
                background: activePage === "leaderboard" ? "#f59e0b" : "transparent",
                color: activePage === "leaderboard" ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.3rem 0.9rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: activePage === "leaderboard" ? "bold" : "normal",
              }}
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={() => setActivePage("competition")}
              style={{
                background: activePage === "competition" ? "#f59e0b" : "transparent",
                color: activePage === "competition" ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.3rem 0.9rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: activePage === "competition" ? "bold" : "normal",
              }}
            >
              🏆 Weekly
            </button>
            <button
              onClick={logout}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "0.4rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </nav>
        {activePage === "dashboard" ? (
          <Dashboard />
        ) : activePage === "leaderboard" ? (
          <Leaderboard />
        ) : activePage === "options" ? (
          <OptionsChain />
        ) : (
          <WeeklyCompetition />
        )}
      </div>
    </PortfolioProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}