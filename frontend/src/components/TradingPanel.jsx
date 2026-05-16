import { useState } from "react";
import { api } from "../services/api";
import { usePortfolio } from "../context/PortfolioContext";

export default function TradingPanel({ currentPrice }) {
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { refresh } = usePortfolio();

  async function handleTrade(action) {
    if (!quantity || isNaN(quantity)) return setMessage({ type: "error", text: "Enter a valid BTC quantity" });
    setLoading(true);
    setMessage(null);
    try {
      const res = action === "BUY" ? await api.placeBuy(parseFloat(quantity)) : await api.placeSell(parseFloat(quantity));
      if (res.status === "success") {
        setMessage({ type: "success", text: res.message });
        setQuantity("");
        await refresh(); // update dashboard
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }

  const cost = quantity && currentPrice ? (parseFloat(quantity) * currentPrice).toFixed(2) : "0.00";

  return (
    <div className="trading-panel">
      <h3>Trade BTC</h3>
      <p className="live-price">Current Price: <strong>${currentPrice?.toLocaleString() ?? "Loading..."}</strong></p>
      <div className="input-group">
        <label>Quantity (BTC)</label>
        <input type="number" step="0.00001" min="0" placeholder="e.g. 0.001" value={quantity} onChange={e => setQuantity(e.target.value)} />
        <small>≈ ${cost} USDT</small>
      </div>
      <div className="trade-buttons">
        <button className="buy-btn" onClick={() => handleTrade("BUY")} disabled={loading}>
          {loading ? "..." : "BUY"}
        </button>
        <button className="sell-btn" onClick={() => handleTrade("SELL")} disabled={loading}>
          {loading ? "..." : "SELL"}
        </button>
      </div>
      {message && <p className={message.type === "error" ? "error-msg" : "success-msg"}>{message.text}</p>}
    </div>
  );
}
