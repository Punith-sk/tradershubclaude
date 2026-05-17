import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard()
      .then(res => {
        if (res.status === "success") setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading leaderboard...</div>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ color: "#f8fafc", marginBottom: "0.25rem" }}>🏆 Leaderboard</h2>
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Ranked by Realized P&L</p>
      </div>

      {data.length === 0 ? (
        <p style={{ color: "#64748b" }}>No traders yet. Be the first!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {data.map((trader) => (
            <div
              key={trader.userId}
              style={{
                background: trader.rank <= 3 ? "linear-gradient(135deg, #1e293b, #0f172a)" : "#1e293b",
                border: `1px solid ${trader.rank === 1 ? "#f59e0b" : trader.rank === 2 ? "#94a3b8" : trader.rank === 3 ? "#b45309" : "#334155"}`,
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                display: "grid",
                gridTemplateColumns: "40px 1fr repeat(4, auto)",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              {/* Rank */}
              <div style={{ fontSize: "1.2rem", textAlign: "center" }}>
                {trader.rank === 1 ? "🥇" : trader.rank === 2 ? "🥈" : trader.rank === 3 ? "🥉" : `#${trader.rank}`}
              </div>

              {/* Name */}
              <div>
                <div style={{ fontWeight: "600", color: "#f8fafc" }}>{trader.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>@{trader.username}</div>
              </div>

              {/* Realized PnL */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.2rem" }}>Realized P&L</div>
                <div style={{ fontWeight: "bold", color: trader.realizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
                  {trader.realizedPnl >= 0 ? "+" : ""}${trader.realizedPnl.toFixed(2)}
                </div>
              </div>

              {/* Return % */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.2rem" }}>Return</div>
                <div style={{ fontWeight: "bold", color: trader.returnPct >= 0 ? "#22c55e" : "#ef4444" }}>
                  {trader.returnPct >= 0 ? "+" : ""}{trader.returnPct}%
                </div>
              </div>

              {/* Win Rate */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.2rem" }}>Win Rate</div>
                <div style={{ color: "#f8fafc" }}>{trader.winRate}%</div>
              </div>

              {/* Trades */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.2rem" }}>Trades</div>
                <div style={{ color: "#f8fafc" }}>{trader.totalTrades}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}