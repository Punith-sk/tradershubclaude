import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function HistoryPanel({ refreshTrigger }) {
  const [filter, setFilter] = useState("futures");
  const [futuresHistory, setFuturesHistory] = useState([]);
  const [spotHistory, setSpotHistory] = useState([]);
  const [optionsHistory, setOptionsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [livePrice, setLivePrice] = useState({});

  useEffect(() => {
    async function fetchPrices() {
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];
      const prices = {};
      for (const sym of symbols) {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`);
          const data = await res.json();
          prices[sym] = parseFloat(data.price);
        } catch { }
      }
      setLivePrice(prices);
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [futuresRes, spotRes, optionsRes] = await Promise.all([
        api.getFuturesHistory(),
        api.getTradeHistory(),
        api.getOptionsHistory(),
      ]);
      if (futuresRes.status === "success") setFuturesHistory(futuresRes.data || []);
      if (spotRes.status === "success") setSpotHistory(spotRes.data || []);
      if (optionsRes.status === "success") setOptionsHistory(optionsRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const FILTERS = [
    { label: "All", value: "all" },
    { label: "Spot", value: "spot" },
    { label: "Futures", value: "futures" },
    { label: "Options", value: "options" },
  ];

  function formatTime(date) {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function calcHeld(start, end) {
    const diffMs = new Date(end) - new Date(start);
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function renderFuturesRow(p) {
    const currentPrice = livePrice[p.symbol] || p.entryPrice;
    const livePnl = p.status === "OPEN"
      ? p.direction === "LONG"
        ? ((currentPrice - p.entryPrice) * p.quantity * 10).toFixed(2)
        : ((p.entryPrice - currentPrice) * p.quantity * 10).toFixed(2)
      : null;
    const isOpen = p.status === "OPEN";

    const getDuration = () => {
      const diffMs = new Date() - new Date(p.createdAt);
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
      <tr key={p._id} style={{ background: isOpen ? "rgba(245,158,11,0.06)" : "transparent", borderLeft: isOpen ? "3px solid #f59e0b" : "3px solid transparent" }}>
        <td style={{ padding: "0.5rem", color: "#94a3b8", fontSize: "0.75rem" }}>FUTURES</td>
        <td style={{ padding: "0.5rem" }}>{p.symbol?.replace("USDT", "")}/USDT</td>
        <td style={{ padding: "0.5rem", color: p.direction === "LONG" ? "#22c55e" : "#ef4444" }}>{p.direction}</td>
        <td style={{ padding: "0.5rem" }}>{p.quantity}</td>
        <td style={{ padding: "0.5rem" }}>${p.entryPrice?.toFixed(2)}</td>
        <td style={{ padding: "0.5rem" }}>
          {isOpen
            ? <span style={{ color: "#f59e0b" }}>${currentPrice?.toFixed(2)}</span>
            : `$${p.closePrice?.toFixed(2)}`}
        </td>
        <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
          {isOpen
            ? <span style={{ color: parseFloat(livePnl) >= 0 ? "#22c55e" : "#ef4444" }}>
                {parseFloat(livePnl) >= 0 ? "+" : ""}${livePnl}
              </span>
            : <span style={{ color: p.realizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
                {p.realizedPnl >= 0 ? "+" : ""}${p.realizedPnl?.toFixed(2)}
              </span>
          }
        </td>
        <td style={{ padding: "0.5rem", color: "#64748b", fontSize: "0.72rem" }}>
          {isOpen
            ? <span>
                <div style={{ color: "#f59e0b" }}>Active · {getDuration()}</div>
                <div>Since {formatTime(p.createdAt)}</div>
              </span>
            : <span>
                <div style={{ color: "#94a3b8" }}>Open: {formatTime(p.createdAt)}</div>
                <div style={{ color: "#94a3b8" }}>Close: {formatTime(p.closedAt)}</div>
                <div style={{ color: "#64748b", fontSize: "0.68rem" }}>Held {calcHeld(p.createdAt, p.closedAt)}</div>
              </span>
          }
        </td>
      </tr>
    );
  }

  function renderSpotRow(t) {
    return (
      <tr key={t.tradeId}>
        <td style={{ padding: "0.5rem", color: "#94a3b8", fontSize: "0.75rem" }}>SPOT</td>
        <td style={{ padding: "0.5rem" }}>BTC/USDT</td>
        <td style={{ padding: "0.5rem", color: t.action === "BUY" ? "#22c55e" : "#ef4444" }}>{t.action}</td>
        <td style={{ padding: "0.5rem" }}>{t.quantity?.toFixed(6)}</td>
        <td style={{ padding: "0.5rem" }}>${t.executionPrice?.toLocaleString()}</td>
        <td style={{ padding: "0.5rem" }}>-</td>
        <td style={{ padding: "0.5rem", color: t.realizedPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
          {t.action === "SELL" ? (t.realizedPnl >= 0 ? "+" : "") + "$" + t.realizedPnl?.toFixed(2) : "-"}
        </td>
        <td style={{ padding: "0.5rem", color: "#64748b", fontSize: "0.75rem" }}>
          {formatTime(t.timestamp)}
        </td>
      </tr>
    );
  }

  function renderOptionsRow(o) {
    const isOpen = o.status === "OPEN";
    return (
      <tr key={o._id} style={{ background: isOpen ? "rgba(245,158,11,0.06)" : "transparent", borderLeft: isOpen ? "3px solid #f59e0b" : "3px solid transparent" }}>
        <td style={{ padding: "0.5rem", color: "#94a3b8", fontSize: "0.75rem" }}>OPTIONS</td>
        <td style={{ padding: "0.5rem", fontSize: "0.75rem" }}>{o.instrumentName}</td>
        <td style={{ padding: "0.5rem", color: o.optionType === "call" ? "#22c55e" : "#ef4444" }}>
          {o.optionType?.toUpperCase()}
        </td>
        <td style={{ padding: "0.5rem" }}>{o.quantity}</td>
        <td style={{ padding: "0.5rem" }}>${o.premium?.toFixed(2)}</td>
        <td style={{ padding: "0.5rem" }}>
          {isOpen
            ? <span style={{ color: "#f59e0b" }}>OPEN</span>
            : `$${o.closePrice?.toFixed(2)}`}
        </td>
        <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
          {isOpen
            ? <span style={{ color: "#f59e0b" }}>Live</span>
            : <span style={{ color: o.realizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
                {o.realizedPnl >= 0 ? "+" : ""}${o.realizedPnl?.toFixed(2)}
              </span>
          }
        </td>
        <td style={{ padding: "0.5rem", color: "#64748b", fontSize: "0.75rem" }}>
          {isOpen
            ? <span>
                <div style={{ color: "#f59e0b" }}>Active</div>
                <div>Since {formatTime(o.createdAt)}</div>
              </span>
            : <span>
                <div style={{ color: "#94a3b8" }}>Open: {formatTime(o.createdAt)}</div>
                <div style={{ color: "#94a3b8" }}>Close: {formatTime(o.closedAt)}</div>
                <div style={{ color: "#64748b", fontSize: "0.68rem" }}>Held {calcHeld(o.createdAt, o.closedAt)}</div>
              </span>
          }
        </td>
      </tr>
    );
  }

  let rows = [];
  if (filter === "futures") rows = futuresHistory.map(renderFuturesRow);
  else if (filter === "spot") rows = spotHistory.map(renderSpotRow);
  else if (filter === "options") rows = optionsHistory.map(renderOptionsRow);
  else if (filter === "all") {
    rows = [
      ...futuresHistory.map(renderFuturesRow),
      ...spotHistory.map(renderSpotRow),
      ...optionsHistory.map(renderOptionsRow),
    ];
  }

  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Trade History</h3>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                background: filter === f.value ? "#f59e0b" : "#0f172a",
                color: filter === f.value ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.25rem 0.75rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: filter === f.value ? "bold" : "normal",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#64748b" }}>No trades yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr>
                {["Type", "Symbol", "Direction", "Qty", "Entry", "Exit", "P&L", "Date"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #334155", color: "#64748b", fontWeight: "500" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}