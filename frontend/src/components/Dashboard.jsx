import { useEffect, useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { subscribeToBtcPrice } from "../services/priceService";
import { api } from "../services/api";
import PriceChart from "./PriceChart";
import FuturesPanel from "./FuturesPanel";
import TradeHistory from "./TradeHistory";

export default function Dashboard() {
  const { portfolio, refresh } = usePortfolio();
  const [livePrice, setLivePrice] = useState(null);
  const [positions, setPositions] = useState([]);

  async function handleReset() {
    if (!window.confirm("Reset portfolio to $10,000? All trades and positions will be deleted.")) return;
    await api.resetPortfolio();
    await refresh();
    window.location.reload();
  }

  async function loadPositions() {
    const res = await api.getFuturesPositions();
    if (res.status === "success") setPositions(res.data || []);
  }

  useEffect(() => {
    refresh();
    loadPositions();
    const unsubscribe = subscribeToBtcPrice((price) => setLivePrice(price.ltp));
    const interval = setInterval(loadPositions, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!portfolio) return <p style={{ padding: "2rem", color: "#94a3b8" }}>Loading portfolio...</p>;

  // Futures-focused stats
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);
  const totalMarginUsed = positions.reduce((sum, p) => sum + (p.margin || 0), 0);
  const totalRealizedPnl = portfolio.realizedPnl || 0;
  const availableBalance = portfolio.cashBalance || 0;
  const totalValue = availableBalance + totalMarginUsed + totalUnrealizedPnl;
  const openPositionsCount = positions.length;

  return (
    <div className="dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>TradersHub</h2>
        <button onClick={handleReset} style={{ background: "#ef4444", color: "white", border: "none", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
          Reset Portfolio
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Value</span>
          <strong>${totalValue.toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span>Available Balance</span>
          <strong>${availableBalance.toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span>Margin Used</span>
          <strong>${totalMarginUsed.toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span>Open Positions</span>
          <strong>{openPositionsCount}</strong>
        </div>
        <div className="stat-card" style={{ color: totalUnrealizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
          <span>Unrealized P&L</span>
          <strong>{totalUnrealizedPnl >= 0 ? "+" : ""}${totalUnrealizedPnl.toFixed(2)}</strong>
        </div>
        <div className="stat-card" style={{ color: totalRealizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
          <span>Realized P&L</span>
          <strong>{totalRealizedPnl >= 0 ? "+" : ""}${totalRealizedPnl.toFixed(2)}</strong>
        </div>
      </div>

      <PriceChart />

      <div className="panels">
        <FuturesPanel currentPrice={livePrice} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <TradeHistory />
        </div>
      </div>
    </div>
  );
}