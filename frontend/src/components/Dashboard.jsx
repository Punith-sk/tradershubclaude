import { useEffect, useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { subscribeToBtcPrice } from "../services/priceService";
import TradingPanel from "./TradingPanel";
import TradeHistory from "./TradeHistory";
import PnLSummary from "./PnLSummary";

export default function Dashboard() {
  const { portfolio, refresh } = usePortfolio();
  const [livePrice, setLivePrice] = useState(null);

  useEffect(() => {
    refresh(); // load portfolio on mount
    const unsubscribe = subscribeToBtcPrice((price) => setLivePrice(price.ltp));
    return unsubscribe;
  }, []);

  if (!portfolio) return <p>Loading portfolio...</p>;

  // Live unrealized P&L — recalculated every price tick
  const unrealizedPnl = livePrice && portfolio.btcHolding > 0
    ? ((livePrice - portfolio.avgBuyPrice) * portfolio.btcHolding).toFixed(2)
    : "0.00";

  const totalValue = livePrice
    ? (portfolio.cashBalance + portfolio.btcHolding * livePrice).toFixed(2)
    : portfolio.totalValue?.toFixed(2);

  return (
    <div className="dashboard">
      <h2>TradersHub Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card"><span>Total Value</span><strong>${totalValue}</strong></div>
        <div className="stat-card"><span>Cash Balance</span><strong>${portfolio.cashBalance?.toFixed(2)}</strong></div>
        <div className="stat-card"><span>BTC Holdings</span><strong>{portfolio.btcHolding?.toFixed(6)} BTC</strong></div>
        <div className="stat-card"><span>Avg Buy Price</span><strong>${portfolio.avgBuyPrice?.toFixed(2)}</strong></div>
        <div className="stat-card pnl" style={{ color: unrealizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
          <span>Unrealized P&L</span><strong>{unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl}</strong>
        </div>
        <div className="stat-card pnl" style={{ color: portfolio.realizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
          <span>Realized P&L</span><strong>{portfolio.realizedPnl >= 0 ? "+" : ""}${portfolio.realizedPnl?.toFixed(2)}</strong>
        </div>
      </div>
      <div className="panels">
        <TradingPanel currentPrice={livePrice} />
        <TradeHistory />
      </div>
    </div>
  );
}
