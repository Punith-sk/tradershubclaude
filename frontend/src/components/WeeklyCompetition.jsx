import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function WeeklyCompetition() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [hallOfFame, setHallOfFame] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("weekly");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [weeklyRes, hofRes] = await Promise.all([
        api.getWeeklyLeaderboard(),
        api.getHallOfFame(),
      ]);
      if (weeklyRes.status === "success") setData(weeklyRes.data);
      if (hofRes.status === "success") setHallOfFame(hofRes.data);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#64748b" }}>Loading competition...</div>;

  const timeLeft = data?.timeLeft;

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#f8fafc", marginBottom: "0.25rem", fontWeight: 700 }}>🏆 Weekly Trading Competition</h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Ranked by % return. Resets every Monday midnight.</p>
        </div>
        {timeLeft && (
          <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "0.75rem 1.25rem", textAlign: "center" }}>
            <div style={{ color: "#f59e0b", fontWeight: "bold", fontSize: "1.1rem" }}>
              {timeLeft.days}d {timeLeft.hours}h
            </div>
            <div style={{ color: "#64748b", fontSize: "0.72rem" }}>TIME REMAINING</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {["weekly", "halloffame"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? "#f59e0b" : "#1e293b",
            color: tab === t ? "#0f172a" : "#94a3b8",
            border: "1px solid #334155",
            padding: "0.4rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: tab === t ? "bold" : "normal",
          }}>
            {t === "weekly" ? "This Week" : "Hall of Fame"}
          </button>
        ))}
      </div>

      {tab === "weekly" && (
        <>
          {/* Top 3 podium */}
          {data?.rankings?.length >= 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              {[data.rankings[1], data.rankings[0], data.rankings[2]].map((trader, i) => {
                if (!trader) return <div key={i} />;
                const heights = ["140px", "170px", "120px"];
                const isYou = trader.userId?.toString() === user?.id?.toString();
                return (
                  <div key={trader.userId} style={{
                    background: i === 1 ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${i === 1 ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "12px",
                    padding: "1.25rem",
                    textAlign: "center",
                    minHeight: heights[i],
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}>
                    <div style={{ fontSize: "2rem" }}>{trader.badge}</div>
                    <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.95rem" }}>
                      {trader.name}
                      {isYou && <span style={{ marginLeft: "0.4rem", background: "#3b82f6", color: "white", fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>YOU</span>}
                    </div>
                    <div style={{ color: trader.returnPct >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold", fontSize: "1.1rem" }}>
                      {trader.returnPct >= 0 ? "+" : ""}{trader.returnPct}%
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{trader.totalTrades} trades · {trader.winRate}% win</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full rankings */}
          {data?.rankings?.length === 0 ? (
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
              <h3 style={{ color: "#f8fafc", marginBottom: "0.5rem" }}>No trades this week yet</h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Be the first to trade and claim the top spot!</p>
            </div>
          ) : (
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 500 }}>
                  {data?.totalParticipants} traders competing this week
                </span>
                <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                  Week: {new Date(data?.weekStart).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} — {new Date(data?.weekEnd).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </span>
              </div>
              {data.rankings.map((trader) => {
                const isYou = trader.userId?.toString() === user?.id?.toString();
                return (
                  <div key={trader.userId} style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid #0f172a",
                    display: "grid",
                    gridTemplateColumns: "40px 1fr repeat(4, auto)",
                    alignItems: "center",
                    gap: "1rem",
                    background: isYou ? "rgba(59,130,246,0.05)" : "transparent",
                    borderLeft: isYou ? "3px solid #3b82f6" : "3px solid transparent",
                  }}>
                    <div style={{ textAlign: "center", fontSize: "1.1rem" }}>
                      {trader.badge || <span style={{ color: "#334155", fontSize: "0.85rem" }}>#{trader.rank}</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.9rem" }}>
                        {trader.name}
                        {isYou && <span style={{ marginLeft: "0.4rem", background: "#3b82f6", color: "white", fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>YOU</span>}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>@{trader.username}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.15rem" }}>Return</div>
                      <div style={{ fontWeight: "bold", color: trader.returnPct >= 0 ? "#22c55e" : "#ef4444" }}>
                        {trader.returnPct >= 0 ? "+" : ""}{trader.returnPct}%
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.15rem" }}>Weekly PnL</div>
                      <div style={{ color: trader.weeklyPnl >= 0 ? "#22c55e" : "#ef4444" }}>
                        {trader.weeklyPnl >= 0 ? "+" : ""}${trader.weeklyPnl}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.15rem" }}>Win Rate</div>
                      <div style={{ color: "#f8fafc" }}>{trader.winRate}%</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.15rem" }}>Trades</div>
                      <div style={{ color: "#f8fafc" }}>{trader.totalTrades}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "halloffame" && (
        <div>
          {hallOfFame.length === 0 ? (
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏛️</div>
              <h3 style={{ color: "#f8fafc", marginBottom: "0.5rem" }}>Hall of Fame is empty</h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Past weekly winners will appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {hallOfFame.map((comp) => (
                <div key={comp._id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1.25rem" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                    Week of {new Date(comp.weekStart).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {comp.winners.map(w => (
                      <div key={w.rank} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>{w.badge}</span>
                        <span style={{ fontWeight: 600, color: "#f8fafc" }}>{w.name}</span>
                        <span style={{ color: "#22c55e", fontSize: "0.85rem" }}>+{w.returnPct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}