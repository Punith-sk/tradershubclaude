import { useState, useEffect } from "react";
import { api } from "../services/api";

const SYMBOLS = [
  { label: "BTC", value: "BTCUSDT" },
  { label: "ETH", value: "ETHUSDT" },
  { label: "SOL", value: "SOLUSDT" },
  { label: "BNB", value: "BNBUSDT" },
  { label: "XRP", value: "XRPUSDT" },
  { label: "ADA", value: "ADAUSDT" },
];

export default function FuturesPanel({ currentPrice, onTradeComplete }) {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [quantity, setQuantity] = useState("");
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [symbolPrices, setSymbolPrices] = useState({});
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [sharePnl, setSharePnl] = useState(0);

  async function loadPositions() {
    const res = await api.getFuturesPositions();
    if (res.status === "success") setPositions(res.data || []);
  }

  async function fetchSymbolPrice(sym) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`);
      const data = await res.json();
      return parseFloat(data.price);
    } catch { return null; }
  }

  async function loadAllPrices() {
    const prices = {};
    for (const s of SYMBOLS) {
      prices[s.value] = await fetchSymbolPrice(s.value);
    }
    setSymbolPrices(prices);
  }

  useEffect(() => {
    loadPositions();
    loadAllPrices();
    const interval = setInterval(() => {
      loadPositions();
      loadAllPrices();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen(direction) {
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return setMessage({ type: "error", text: "Enter valid quantity" });
    }
    setLoading(true);
    setMessage(null);
    const res = await api.openFuturesPosition(direction, parseFloat(quantity), symbol);
    if (res.status === "success") {
      setMessage({ type: "success", text: res.message });
      setQuantity("");
      await loadPositions();
    } else {
      setMessage({ type: "error", text: res.message });
    }
    setLoading(false);
  }

  async function handleClose(positionId) {
    setLoading(true);
    setMessage(null);
    const res = await api.closeFuturesPosition(positionId);
    if (res.status === "success") {
      setMessage({ type: "success", text: res.message });
      await loadPositions();
      if (onTradeComplete) onTradeComplete();
      if (res.realizedPnl > 0) {
        setSharePnl(res.realizedPnl);
        setShowSharePopup(true);
      }
    } else {
      setMessage({ type: "error", text: res.message });
    }
    setLoading(false);
  }

  async function handleCloseAll() {
    if (!window.confirm("Close all open futures positions?")) return;
    setLoading(true);
    let totalPnl = 0;
    for (const pos of positions) {
      const res = await api.closeFuturesPosition(pos._id);
      if (res.status === "success" && res.realizedPnl) {
        totalPnl += res.realizedPnl;
      }
    }
    await loadPositions();
    if (onTradeComplete) onTradeComplete();
    setLoading(false);
    setMessage({ type: "success", text: "All positions closed" });
    if (totalPnl > 0) {
      setSharePnl(totalPnl);
      setShowSharePopup(true);
    }
  }

  const selectedPrice = symbolPrices[symbol] || currentPrice || 0;
  const margin = quantity && selectedPrice
    ? ((parseFloat(quantity) * selectedPrice) / 10).toFixed(2)
    : "0.00";
  const liqLong = selectedPrice ? (selectedPrice * (1 - 1 / 10 + 0.005)).toFixed(2) : "-";
  const liqShort = selectedPrice ? (selectedPrice * (1 + 1 / 10 - 0.005)).toFixed(2) : "-";
  const hasOpenForSymbol = positions.some((p) => p.symbol === symbol);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Trading Panel */}
      <div className="trading-panel">
        <h3>
          Futures Trading
          <span style={{ fontSize: "0.75rem", background: "#f59e0b", color: "#0f172a", padding: "0.2rem 0.5rem", borderRadius: "4px", marginLeft: "0.5rem" }}>
            10x
          </span>
        </h3>

        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          {SYMBOLS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSymbol(s.value)}
              style={{
                background: symbol === s.value ? "#f59e0b" : "#0f172a",
                color: symbol === s.value ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.25rem 0.75rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: symbol === s.value ? "bold" : "normal",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="live-price">
          {symbol}: <strong>${selectedPrice?.toLocaleString() ?? "Loading..."}</strong>
        </p>

        <div className="input-group">
          <label>Quantity ({SYMBOLS.find(s => s.value === symbol)?.label})</label>
          <input
            type="number"
            step="0.001"
            min="0"
            placeholder="e.g. 0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <small>Margin: ${margin} | 10x Leverage</small>
        </div>

        {quantity && selectedPrice && (
          <div style={{ background: "#0f172a", borderRadius: "6px", padding: "0.6rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Notional Value</span>
              <span>${(parseFloat(quantity || 0) * selectedPrice).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
              <span>Liq Price (LONG)</span>
              <span style={{ color: "#ef4444" }}>${liqLong}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
              <span>Liq Price (SHORT)</span>
              <span style={{ color: "#ef4444" }}>${liqShort}</span>
            </div>
          </div>
        )}

        <div className="trade-buttons">
          <button className="buy-btn" onClick={() => handleOpen("LONG")} disabled={loading || hasOpenForSymbol}>
            {loading ? "..." : "LONG"}
          </button>
          <button className="sell-btn" onClick={() => handleOpen("SHORT")} disabled={loading || hasOpenForSymbol}>
            {loading ? "..." : "SHORT"}
          </button>
        </div>

        {hasOpenForSymbol && (
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem", textAlign: "center" }}>
            Close {symbol} position before opening new one
          </p>
        )}
        {message && (
          <p className={message.type === "error" ? "error-msg" : "success-msg"}>
            {message.text}
          </p>
        )}
      </div>

      {/* Open Positions */}
      {positions.length > 0 && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ margin: 0 }}>Open Positions ({positions.length})</h3>
            <button
              onClick={handleCloseAll}
              disabled={loading}
              style={{ background: "#ef4444", color: "white", border: "none", padding: "0.3rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
            >
              Close All
            </button>
          </div>

          {positions.map((pos) => (
            <div
              key={pos._id}
              style={{ border: `1px solid ${pos.direction === "LONG" ? "#22c55e" : "#ef4444"}`, borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: "bold" }}>
                  {pos.symbol}
                  <span style={{ marginLeft: "0.5rem", color: pos.direction === "LONG" ? "#22c55e" : "#ef4444" }}>
                    {pos.direction}
                  </span>
                </span>
                <button
                  onClick={() => handleClose(pos._id)}
                  disabled={loading}
                  style={{ background: "#ef4444", color: "white", border: "none", padding: "0.3rem 0.75rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Close
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem", fontSize: "0.8rem" }}>
                <span style={{ color: "#94a3b8" }}>Entry</span><span>${pos.entryPrice?.toFixed(2)}</span>
                <span style={{ color: "#94a3b8" }}>Qty</span><span>{pos.quantity}</span>
                <span style={{ color: "#94a3b8" }}>Margin</span><span>${pos.margin?.toFixed(2)}</span>
                <span style={{ color: "#94a3b8" }}>Liq Price</span><span style={{ color: "#ef4444" }}>${pos.liquidationPrice?.toFixed(2)}</span>
                <span style={{ color: "#94a3b8" }}>Unrealized PnL</span>
                <span style={{ color: pos.unrealizedPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                  {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl} ({pos.pnlPct >= 0 ? "+" : ""}{pos.pnlPct}%)
                </span>
                {pos.isLiquidated && (
                  <span style={{ gridColumn: "1/-1", color: "#ef4444", fontWeight: "bold", textAlign: "center" }}>
                    ⚠️ LIQUIDATED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profit Share Popup */}
      {showSharePopup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1e293b", border: "1px solid #22c55e", borderRadius: "16px", padding: "2rem", maxWidth: "380px", width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎉</div>
            <h2 style={{ color: "#22c55e", marginBottom: "0.5rem" }}>+${sharePnl.toFixed(2)} Profit!</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              You just closed a winning trade on TradersHub. Share your win!
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              <button
                onClick={() => {
                  const text = `I just made +$${sharePnl.toFixed(2)} on crypto futures trading on TradersHub! 🚀 Practice trading risk-free at tradershub.app`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  setShowSharePopup(false);
                }}
                style={{ background: "#25D366", color: "white", border: "none", padding: "0.75rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}
              >
                📱 Share on WhatsApp
              </button>
              <button
                onClick={() => {
                  const text = `I just made +$${sharePnl.toFixed(2)} on crypto futures trading! 🚀 Practice trading risk-free on TradersHub`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                  setShowSharePopup(false);
                }}
                style={{ background: "#1DA1F2", color: "white", border: "none", padding: "0.75rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}
              >
                🐦 Share on Twitter
              </button>
            </div>
            <button
              onClick={() => setShowSharePopup(false)}
              style={{ background: "transparent", color: "#64748b", border: "1px solid #334155", padding: "0.5rem 1.5rem", borderRadius: "8px", cursor: "pointer" }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}