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
import ProfilePage from "./components/ProfilePage";

const NAV_ITEMS = [
  { label: "Trading", value: "dashboard" },
  { label: "Options", value: "options" },
  { label: "🏆 Leaderboard", value: "leaderboard" },
  { label: "🗓 Weekly", value: "competition" },
  { label: "Profile", value: "profile" },
];

function AppContent() {
  const { isLoggedIn, logout } = useAuth();
  const [page, setPage] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");
  const [showLanding, setShowLanding] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isLoggedIn && showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!isLoggedIn) {
    return page === "login"
      ? <LoginPage onSwitch={() => setPage("register")} />
      : <RegisterPage onSwitch={() => setPage("login")} />;
  }

  function navigate(page) {
    setActivePage(page);
    setMenuOpen(false);
  }

  return (
    <PortfolioProvider>
      <div className="app">
        <style>{`
          .nav-desktop { display: flex; gap: 0.5rem; align-items: center; }
          .hamburger { display: none; background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 1.2rem; }
          .mobile-menu { display: none; }
          @media (max-width: 768px) {
            .nav-desktop { display: none; }
            .hamburger { display: block; }
            .mobile-menu {
              display: ${menuOpen ? "flex" : "none"};
              flex-direction: column;
              position: absolute;
              top: 56px;
              left: 0;
              right: 0;
              background: #1e293b;
              border-bottom: 1px solid #334155;
              padding: 0.75rem;
              gap: 0.5rem;
              z-index: 99;
            }
            .mobile-menu button {
              width: 100%;
              text-align: left;
              padding: 0.75rem 1rem;
              border-radius: 8px;
              border: 1px solid #334155;
              background: transparent;
              color: #94a3b8;
              cursor: pointer;
              font-size: 0.95rem;
            }
            .mobile-menu button.active {
              background: #f59e0b;
              color: #0f172a;
              font-weight: bold;
              border-color: #f59e0b;
            }
            .mobile-menu .logout-btn {
              background: #ef4444 !important;
              color: white !important;
              border-color: #ef4444 !important;
            }
          }
        `}</style>

        <nav style={{ position: "relative" }}>
          <h1 style={{ cursor: "pointer" }} onClick={() => navigate("dashboard")}>TradersHub</h1>

          {/* Desktop nav */}
          <div className="nav-desktop">
            {NAV_ITEMS.map(item => (
              <button
                key={item.value}
                onClick={() => navigate(item.value)}
                style={{
                  background: activePage === item.value ? "#f59e0b" : "transparent",
                  color: activePage === item.value ? "#0f172a" : "#94a3b8",
                  border: "1px solid #334155",
                  padding: "0.3rem 0.9rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: activePage === item.value ? "bold" : "normal",
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={logout}
              style={{ background: "#ef4444", color: "white", border: "none", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer" }}
            >
              Logout
            </button>
          </div>

          {/* Hamburger button */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>

          {/* Mobile dropdown menu */}
          <div className="mobile-menu">
            {NAV_ITEMS.map(item => (
              <button
                key={item.value}
                className={activePage === item.value ? "active" : ""}
                onClick={() => navigate(item.value)}
              >
                {item.label}
              </button>
            ))}
            <button className="logout-btn" onClick={() => { logout(); setMenuOpen(false); }}>
              Logout
            </button>
          </div>
        </nav>

        {activePage === "dashboard" ? <Dashboard />
          : activePage === "leaderboard" ? <Leaderboard />
          : activePage === "options" ? <OptionsChain />
          : activePage === "competition" ? <WeeklyCompetition />
          : activePage === "profile" ? <ProfilePage />
          : <Dashboard />}
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