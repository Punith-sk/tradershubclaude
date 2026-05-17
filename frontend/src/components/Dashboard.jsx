import { useEffect, useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { subscribeToBtcPrice } from "../services/priceService";
import { api } from "../services/api";
import TradingPanel from "./TradingPanel";
import TradeHistory from "./TradeHistory";
import PriceChart from "./PriceChart";
import FuturesPanel from "./FuturesPanel";

export default function Dashboard() {
  const { portfolio, refresh } = usePortfolio();
  const [livePrice, setLivePrice] = useState(null);

  async function handleReset() {
    if (!window.confirm("Reset portfolio to $10,000? All trades will be deleted.")) return;
    await api.resetPortfolio();
    await refresh();
    window.location.reload();
  }

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToBtcPrice((price) => setLivePrice(price.ltp));
    return unsubscribe;
  }, []);

  if (!portfolio) return <p>Loading portfolio...</p>;

  const unrealizedPnl = livePrice && portfolio.btcHolding > 0
    ? ((livePrice - portfolio.avgBuyPrice) * portfolio.btcHolding).toFixed(2)
    : "0.00";

  const totalValue = livePrice
    ? (portfolio.cashBalance + portfolio.btcHolding * livePrice).toFixed(2)
    : portfolio.totalValue?.toFixed(2);

  return (
    <div className="dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>TradersHub Dashboard</h2>
        <button onClick={handleReset} style={{ background: "#ef4444", color: "white", border: "none", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
          Reset Portfolio
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span>Total Value</span><strong>${totalValue}</strong></div>
        <div className="stat-card"><span>Cash Balance</span><strong>${portfolio.cashBalance?.toFixed(2)}</strong></div>
        <div className="stat-card"><span>BTC Holdings</span><strong>{portfolio.btcHolding?.toFixed(6)} BTC</strong></div>
        <div className="stat-card"><span>Avg Buy Price</span><strong>${portfolio.avgBuyPrice?.toFixed(2)}</strong></div>
        <div className="stat-card" style={{ color: unrealizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
          <span>Unrealized P&L</span><strong>{unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl}</strong>
        </div>
        <div className="stat-card" style={{ color: portfolio.realizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
          <span>Realized P&L</span><strong>{portfolio.realizedPnl >= 0 ? "+" : ""}${portfolio.realizedPnl?.toFixed(2)}</strong>
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