import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getProfile().then(res => {
      if (res.status === "success") setProfile(res.data);
      setLoading(false);
    });
  }, []);

  async function handleUpdateUsername() {
    const res = await api.updateUsername(newUsername);
    if (res.status === "success") {
      setMessage({ type: "success", text: "Username updated!" });
      setEditingUsername(false);
      const updated = await api.getProfile();
      if (updated.status === "success") setProfile(updated.data);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  }

  if (loading) return <div style={{ padding: "2rem", color: "#64748b" }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: "2rem", color: "#ef4444" }}>Failed to load profile.</div>;

  const { stats } = profile;
  const isProfit = stats.totalPnl >= 0;

  const statCards = [
    { label: "Total P&L", value: `${isProfit ? "+" : ""}$${stats.totalPnl}`, color: isProfit ? "#22c55e" : "#ef4444" },
    { label: "Return %", value: `${stats.returnPct >= 0 ? "+" : ""}${stats.returnPct}%`, color: stats.returnPct >= 0 ? "#22c55e" : "#ef4444" },
    { label: "Available Balance", value: `$${stats.availableBalance}`, color: "#f8fafc" },
    { label: "Total Trades", value: stats.totalTrades, color: "#f8fafc" },
    { label: "Overall Win Rate", value: `${stats.overallWinRate}%`, color: "#f59e0b" },
    { label: "Best Trade", value: `+$${stats.bestTrade}`, color: "#22c55e" },
    { label: "Worst Trade", value: `$${stats.worstTrade}`, color: "#ef4444" },
    { label: "Fav Symbol", value: stats.favoriteSymbol, color: "#f59e0b" },
  ];

  return (
    <div style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Profile Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid #334155", borderRadius: "16px", padding: "2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Avatar */}
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#0f172a", flexShrink: 0 }}>
          {profile.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + Username */}
        <div style={{ flex: 1 }}>
          <h2 style={{ color: "#f8fafc", marginBottom: "0.25rem", fontSize: "1.5rem" }}>{profile.name}</h2>
          {editingUsername ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="new username"
                style={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.9rem" }}
              />
              <button onClick={handleUpdateUsername} style={{ background: "#f59e0b", color: "#0f172a", border: "none", padding: "0.4rem 0.75rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>Save</button>
              <button onClick={() => setEditingUsername(false)} style={{ background: "transparent", color: "#64748b", border: "1px solid #334155", padding: "0.4rem 0.75rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>@{profile.username}</span>
              <button onClick={() => { setEditingUsername(true); setNewUsername(profile.username); }} style={{ background: "transparent", border: "1px solid #334155", color: "#64748b", padding: "0.15rem 0.5rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.72rem" }}>Edit</button>
            </div>
          )}
          {message && <p style={{ color: message.type === "success" ? "#22c55e" : "#ef4444", fontSize: "0.8rem", marginTop: "0.4rem" }}>{message.text}</p>}
          <div style={{ color: "#334155", fontSize: "0.75rem", marginTop: "0.4rem" }}>
            Joined {new Date(profile.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* P&L Badge */}
        <div style={{ background: isProfit ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${isProfit ? "#22c55e" : "#ef4444"}`, borderRadius: "12px", padding: "1rem 1.5rem", textAlign: "center" }}>
          <div style={{ color: "#64748b", fontSize: "0.72rem", marginBottom: "0.25rem" }}>TOTAL P&L</div>
          <div style={{ color: isProfit ? "#22c55e" : "#ef4444", fontSize: "1.8rem", fontWeight: "bold" }}>
            {isProfit ? "+" : ""}${stats.totalPnl}
          </div>
          <div style={{ color: isProfit ? "#22c55e" : "#ef4444", fontSize: "0.85rem" }}>
            {stats.returnPct >= 0 ? "+" : ""}{stats.returnPct}% return
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <div style={{ color: s.color, fontWeight: "bold", fontSize: "1.2rem", marginBottom: "0.3rem" }}>{s.value}</div>
            <div style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1.25rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "#f8fafc", fontSize: "1rem" }}>Futures Stats</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              { label: "Total Trades", value: stats.totalFuturesTrades },
              { label: "Win Rate", value: `${stats.futuresWinRate}%` },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "#64748b" }}>{s.label}</span>
                <span style={{ color: "#f8fafc", fontWeight: 500 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1.25rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "#f8fafc", fontSize: "1rem" }}>Options Stats</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              { label: "Total Trades", value: stats.totalOptionsTrades },
              { label: "Win Rate", value: `${stats.optionsWinRate}%` },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "#64748b" }}>{s.label}</span>
                <span style={{ color: "#f8fafc", fontWeight: 500 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Referral Section */}
            {profile.referralCode && (
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1.25rem", marginTop: "1rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#f8fafc", fontSize: "1rem" }}>🔗 Refer & Earn</h3>
                <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Share your referral link. Both you and your friend get <strong style={{ color: "#f59e0b" }}>$5,000 bonus</strong> virtual capital!
                </p>
                <div style={{ background: "#0f172a", borderRadius: "8px", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ color: "#f59e0b", fontFamily: "monospace", fontSize: "0.9rem", wordBreak: "break-all" }}>
                    {profile.referralLink}
                </span>
                <button
                    onClick={() => {
                    navigator.clipboard.writeText(profile.referralLink);
                    alert("Referral link copied!");
                    }}
                    style={{ background: "#f59e0b", color: "#0f172a", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem", flexShrink: 0 }}
                >
                    Copy
                </button>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ background: "#0f172a", borderRadius: "8px", padding: "0.75rem 1rem", flex: 1, textAlign: "center" }}>
                    <div style={{ color: "#f59e0b", fontWeight: "bold", fontSize: "1.3rem" }}>{profile.referralCount || 0}</div>
                    <div style={{ color: "#64748b", fontSize: "0.72rem" }}>FRIENDS REFERRED</div>
                </div>
                <div style={{ background: "#0f172a", borderRadius: "8px", padding: "0.75rem 1rem", flex: 1, textAlign: "center" }}>
                    <div style={{ color: "#22c55e", fontWeight: "bold", fontSize: "1.3rem" }}>${(profile.referralCount || 0) * 5000}</div>
                    <div style={{ color: "#64748b", fontSize: "0.72rem" }}>BONUS EARNED</div>
                </div>
                </div>
            </div>
            )}
      </div>
    </div>
  );
}