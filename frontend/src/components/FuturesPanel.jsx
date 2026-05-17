import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function FuturesPanel({ currentPrice }) {
  const [quantity, setQuantity] = useState("");
  const [position, setPosition] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadPosition() {
    const res = await api.getFuturesPosition();
    if (res.status === "success") setPosition(res.data);
  }

  async function loadHistory() {
    const res = await api.getFuturesHistory();
    if (res.status === "success") setHistory(res.data);
  }

  useEffect(() => {
    loadPosition();
    loadHistory();
    const interval = setInterval(loadPosition, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  async function handleOpen(direction) {
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return setMessage({ type: "error", text: "Enter valid BTC quantity" });
    }
    setLoading(true);
    setMessage(null);
    const res = await api.openFuturesPosition(direction, parseFloat(quantity));
    if (res.status === "success") {
      setMessage({ type: "success", text: res.message });
      setQuantity("");
      await loadPosition();
    } else {
      setMessage({ type: "error", text: res.message });
    }
    setLoading(false);
  }

  async function handleClose() {
    if (!position) return;
    setLoading(true);
    setMessage(null);
    const res = await api.closeFuturesPosition(position._id);
    if (res.status === "success") {
      setMessage({ type: "success", text: res.message });
      setPosition(null);
      await loadHistory();
    } else {
      setMessage({ type: "error", text: res.message });
    }
    setLoading(false);
  }

  const margin = quantity && currentPrice
    ? ((parseFloat(quantity) * currentPrice) / 10).toFixed(2)
    : "0.00";

  const liqLong = quantity && currentPrice
    ? (currentPrice * (1 - 1 / 10 + 0.005)).toFixed(2)
    : "-";

  const liqShort = quantity && currentPrice
    ? (currentPrice * (1 + 1 / 10 - 0.005)).toFixed(2)
    : "-";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Open Position Panel */}
      <div className="trading-panel">
        <h3>Futures Trading <span style={{ fontSize: "0.75rem", background: "#f59e0b", color: "#0f172a", padding: "0.2rem 0.5rem", borderRadius: "4px", marginLeft: "0.5rem" }}>10x</span></h3>
        <p className="live-price">Mark Price: <strong>${currentPrice?.toLocaleString() ?? "Loading..."}</strong></p>

        <div className="input-group">
          <label>Quantity (BTC)</label>
          <input
            type="number"
            step="0.001"
            min="0"
            placeholder="e.g. 0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <small>Margin required: ${margin} | Leverage: 10x</small>
        </div>

        {quantity && currentPrice && (
          <div style={{ background: "#0f172a", borderRadius: "6px", padding: "0.6rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Notional Value</span>
              <span>${(parseFloat(quantity || 0) * currentPrice).toFixed(2)}</span>
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
          <button
            className="buy-btn"
            onClick={() => handleOpen("LONG")}
            disabled={loading || !!position}
          >
            {loading ? "..." : "LONG"}
          </button>
          <button
            className="sell-btn"
            onClick={() => handleOpen("SHORT")}
            disabled={loading || !!position}
          >
            {loading ? "..." : "SHORT"}
          </button>
        </div>
        {position && <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem", textAlign: "center" }}>Close current position before opening new one</p>}
        {message && <p className={message.type === "error" ? "error-msg" : "success-msg"}>{message.text}</p>}
      </div>

      {/* Open Position Display */}
      {position && (
        <div style={{ background: "#1e293b", border: `1px solid ${position.direction === "LONG" ? "#22c55e" : "#ef4444"}`, borderRadius: "10px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ margin: 0 }}>
              Open Position
              <span style={{ marginLeft: "0.5rem", color: position.direction === "LONG" ? "#22c55e" : "#ef4444", fontSize: "0.9rem" }}>
                {position.direction}
              </span>
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              style={{ background: "#ef4444", color: "white", border: "none", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
            >
              Close Position
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
            <div style={{ color: "#94a3b8" }}>Entry Price</div>
            <div>${position.entryPrice?.toFixed(2)}</div>
            <div style={{ color: "#94a3b8" }}>Quantity</div>
            <div>{position.quantity} BTC</div>
            <div style={{ color: "#94a3b8" }}>Margin</div>
            <div>${position.margin?.toFixed(2)}</div>
            <div style={{ color: "#94a3b8" }}>Leverage</div>
            <div>{position.leverage}x</div>
            <div style={{ color: "#94a3b8" }}>Liq. Price</div>
            <div style={{ color: "#ef4444" }}>${position.liquidationPrice?.toFixed(2)}</div>
            <div style={{ color: "#94a3b8" }}>Unrealized PnL</div>
            <div style={{ color: position.unrealizedPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
              {position.unrealizedPnl >= 0 ? "+" : ""}${position.unrealizedPnl}
              <span style={{ fontSize: "0.75rem", marginLeft: "0.3rem" }}>({position.pnlPct >= 0 ? "+" : ""}{position.pnlPct}%)</span>
            </div>
            {position.isLiquidated && (
              <div style={{ gridColumn: "1/-1", color: "#ef4444", fontWeight: "bold", textAlign: "center" }}>
                ⚠️ LIQUIDATED
              </div>
            )}
          </div>
        </div>
      )}

      {/* Position History */}
      {history.length > 0 && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", overflowX: "auto" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>Futures History</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr>
                {["Direction", "Qty", "Entry", "Exit", "PnL", "Date"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "0.4rem", borderBottom: "1px solid #334155", color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p._id}>
                  <td style={{ padding: "0.4rem", color: p.direction === "LONG" ? "#22c55e" : "#ef4444" }}>{p.direction}</td>
                  <td style={{ padding: "0.4rem" }}>{p.quantity}</td>
                  <td style={{ padding: "0.4rem" }}>${p.entryPrice?.toFixed(2)}</td>
                  <td style={{ padding: "0.4rem" }}>${p.closePrice?.toFixed(2)}</td>
                  <td style={{ padding: "0.4rem", color: p.realizedPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                    {p.realizedPnl >= 0 ? "+" : ""}${p.realizedPnl?.toFixed(2)}
                  </td>
                  <td style={{ padding: "0.4rem", color: "#64748b" }}>{new Date(p.closedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}