import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";

export default function ShareCard({ onClose }) {
  const cardRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    async function load() {
      const [portfolioRes, historyRes] = await Promise.all([
        api.getPortfolio(),
        api.getFuturesHistory(),
      ]);

      const portfolio = portfolioRes.data;
      const history = historyRes.data || [];

      const totalTrades = history.length;
      const winningTrades = history.filter(p => p.realizedPnl > 0).length;
      const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
      const bestTrade = history.length > 0
        ? Math.max(...history.map(p => p.realizedPnl))
        : 0;

      setStats({
        realizedPnl: portfolio?.realizedPnl || 0,
        returnPct: (((portfolio?.realizedPnl || 0) / 10000) * 100).toFixed(2),
        availableBalance: portfolio?.cashBalance || 0,
        totalTrades,
        winRate,
        bestTrade: +bestTrade.toFixed(2),
      });
    }
    load();
  }, []);

  async function handleScreenshot() {
    setCopying(true);
    try {
      const html2canvas = (await import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")).default;
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tradershub-pnl.png";
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch {
      // fallback — just tell user to screenshot manually
      alert("Right-click the card and save as image, or take a screenshot!");
    }
    setCopying(false);
  }

  if (!stats) return null;

  const isProfit = stats.realizedPnl >= 0;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, padding: "1rem"
    }}>
      <div style={{ maxWidth: "420px", width: "100%" }}>

        {/* The shareable card */}
        <div ref={cardRef} style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          border: `2px solid ${isProfit ? "#22c55e" : "#ef4444"}`,
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "1rem",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background glow */}
          <div style={{
            position: "absolute", top: "-50px", right: "-50px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: isProfit ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            filter: "blur(40px)",
          }} />

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ color: "#f59e0b", fontWeight: "bold", fontSize: "1.2rem" }}>TradersHub</div>
              <div style={{ color: "#64748b", fontSize: "0.75rem" }}>crypto futures paper trading</div>
            </div>
            <div style={{ fontSize: "2rem" }}>{isProfit ? "📈" : "📉"}</div>
          </div>

          {/* Main P&L */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.4rem" }}>Total Realized P&L</div>
            <div style={{
              fontSize: "3rem", fontWeight: "bold",
              color: isProfit ? "#22c55e" : "#ef4444",
              lineHeight: 1,
            }}>
              {isProfit ? "+" : ""}${stats.realizedPnl.toFixed(2)}
            </div>
            <div style={{
              fontSize: "1.2rem", fontWeight: "600",
              color: isProfit ? "#22c55e" : "#ef4444",
              marginTop: "0.4rem", opacity: 0.8,
            }}>
              {isProfit ? "+" : ""}{stats.returnPct}% return
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Win Rate", value: `${stats.winRate}%` },
              { label: "Total Trades", value: stats.totalTrades },
              { label: "Best Trade", value: `+$${stats.bestTrade}` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "0.75rem 0.5rem" }}>
                <div style={{ color: "#f8fafc", fontWeight: "bold", fontSize: "1.1rem" }}>{s.value}</div>
                <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: "0.2rem" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #334155", paddingTop: "1rem" }}>
            <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
              Starting capital: $10,000
            </div>
            <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
              tradershub.app
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <button
            onClick={handleScreenshot}
            disabled={copying}
            style={{
              background: "#f59e0b", color: "#0f172a", border: "none",
              padding: "0.75rem", borderRadius: "8px", fontWeight: "bold",
              cursor: "pointer", fontSize: "0.9rem",
            }}
          >
            {copying ? "Saving..." : "📥 Save Image"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent", color: "#94a3b8",
              border: "1px solid #334155", padding: "0.75rem",
              borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}