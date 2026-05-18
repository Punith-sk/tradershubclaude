import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function OptionsChain() {
  const [expiries, setExpiries] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState(null);
  const [chain, setChain] = useState([]);
  const [btcPrice, setBtcPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buyModal, setBuyModal] = useState(null);
  const [quantity, setQuantity] = useState(0.1);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState(null);
  const [openOptions, setOpenOptions] = useState([]);
  const [closing, setClosing] = useState(null);

  useEffect(() => {
    api.getExpiries().then(res => {
      if (res.status === "success") {
        setExpiries(res.data);
        if (res.data.length > 0) setSelectedExpiry(res.data[0]);
      }
    });
    loadOpenOptions();
  }, []);

  useEffect(() => {
    if (selectedExpiry) loadChain(selectedExpiry.timestamp);
  }, [selectedExpiry]);

  async function loadChain(timestamp) {
    setLoading(true);
    setChain([]);
    const res = await api.getOptionsChain(timestamp);
    if (res.status === "success") {
      setChain(res.data.chain || []);
      setBtcPrice(res.data.btcPrice);
    }
    setLoading(false);
  }

  async function loadOpenOptions() {
    const res = await api.getOpenOptions();
    if (res.status === "success") setOpenOptions(res.data || []);
  }

  async function handleBuy() {
    if (!buyModal || !quantity) return;
    setBuying(true);
    setMessage(null);
    const res = await api.buyOption({
      instrumentName: buyModal.instrument,
      quantity: parseFloat(quantity),
      optionType: buyModal.type,
      strike: buyModal.strike,
      expiry: selectedExpiry.timestamp,
      expiryLabel: selectedExpiry.label,
    });
    if (res.status === "success") {
      setMessage({ type: "success", text: res.message });
      setBuyModal(null);
      setQuantity(0.1);
      loadOpenOptions();
    } else {
      setMessage({ type: "error", text: res.message });
    }
    setBuying(false);
  }

  async function handleClose(optionId) {
    setClosing(optionId);
    const res = await api.closeOption(optionId);
    if (res.status === "success") {
      setMessage({ type: "success", text: res.message });
      loadOpenOptions();
    } else {
      setMessage({ type: "error", text: res.message });
    }
    setClosing(null);
  }

  const thStyle = { padding: "0.5rem", color: "#64748b", fontSize: "0.75rem", fontWeight: "500", textAlign: "right", borderBottom: "1px solid #1e293b" };
  const tdStyle = { padding: "0.4rem 0.5rem", fontSize: "0.8rem", textAlign: "right" };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ color: "#f8fafc", marginBottom: "0.25rem" }}>Options Chain</h2>
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
          BTC Options via Deribit {btcPrice && <span style={{ color: "#f59e0b", marginLeft: "0.5rem" }}>BTC: ${btcPrice?.toLocaleString()}</span>}
        </p>
      </div>

      {message && (
        <div style={{ background: message.type === "success" ? "#14532d" : "#7f1d1d", border: `1px solid ${message.type === "success" ? "#22c55e" : "#ef4444"}`, borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.85rem", color: message.type === "success" ? "#22c55e" : "#ef4444" }}>
          {message.text}
          <button onClick={() => setMessage(null)} style={{ float: "right", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Expiry selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {expiries.map(e => (
          <button
            key={e.timestamp}
            onClick={() => setSelectedExpiry(e)}
            style={{
              background: selectedExpiry?.timestamp === e.timestamp ? "#f59e0b" : "#1e293b",
              color: selectedExpiry?.timestamp === e.timestamp ? "#0f172a" : "#94a3b8",
              border: "1px solid #334155",
              padding: "0.3rem 0.9rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: selectedExpiry?.timestamp === e.timestamp ? "bold" : "normal",
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Options Chain Table */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", overflowX: "auto", marginBottom: "1.5rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading options chain...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                {/* CALLS */}
                <th style={{ ...thStyle, textAlign: "left", color: "#22c55e" }}>Buy</th>
                <th style={thStyle}>IV%</th>
                <th style={thStyle}>Delta</th>
                <th style={thStyle}>Theta</th>
                <th style={thStyle}>Ask</th>
                <th style={thStyle}>Bid</th>
                <th style={{ ...thStyle, color: "#22c55e" }}>CALL</th>
                {/* STRIKE */}
                <th style={{ ...thStyle, textAlign: "center", color: "#f59e0b", fontSize: "0.85rem" }}>STRIKE</th>
                {/* PUTS */}
                <th style={{ ...thStyle, color: "#ef4444" }}>PUT</th>
                <th style={thStyle}>Bid</th>
                <th style={thStyle}>Ask</th>
                <th style={thStyle}>Theta</th>
                <th style={thStyle}>Delta</th>
                <th style={thStyle}>IV%</th>
                <th style={{ ...thStyle, textAlign: "right", color: "#ef4444" }}>Buy</th>
              </tr>
            </thead>
            <tbody>
              {chain.map((row) => {
                const isATM = row.isATM;
                const rowBg = isATM ? "rgba(245,158,11,0.06)" : "transparent";
                const strikeBg = isATM ? "rgba(245,158,11,0.15)" : "#0f172a";

                return (
                  <tr key={row.strike} style={{ background: rowBg, borderBottom: "1px solid #1e293b" }}>
                    {/* CALL side */}
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      {row.call && (
                        <button
                          onClick={() => { setBuyModal({ instrument: row.call.instrument, type: "call", strike: row.strike, price: row.call.bestAsk }); setMessage(null); }}
                          style={{ background: "#16a34a", color: "white", border: "none", padding: "0.2rem 0.6rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.72rem" }}
                        >
                          BUY
                        </button>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: "#94a3b8" }}>{row.call?.iv || "-"}</td>
                    <td style={{ ...tdStyle, color: "#22c55e" }}>{row.call?.delta || "-"}</td>
                    <td style={{ ...tdStyle, color: "#ef4444" }}>{row.call?.theta || "-"}</td>
                    <td style={{ ...tdStyle, color: "#f8fafc" }}>${row.call?.bestAsk || "-"}</td>
                    <td style={{ ...tdStyle, color: "#94a3b8" }}>${row.call?.bestBid || "-"}</td>
                    <td style={{ ...tdStyle, color: "#22c55e", fontWeight: "500" }}>${row.call?.markPrice || "-"}</td>

                    {/* STRIKE */}
                    <td style={{ ...tdStyle, textAlign: "center", background: strikeBg, color: isATM ? "#f59e0b" : "#f8fafc", fontWeight: isATM ? "bold" : "normal", fontSize: isATM ? "0.85rem" : "0.8rem" }}>
                      {row.strike.toLocaleString()}
                      {isATM && <div style={{ fontSize: "0.6rem", color: "#f59e0b" }}>ATM</div>}
                    </td>

                    {/* PUT side */}
                    <td style={{ ...tdStyle, color: "#ef4444", fontWeight: "500" }}>${row.put?.markPrice || "-"}</td>
                    <td style={{ ...tdStyle, color: "#94a3b8" }}>${row.put?.bestBid || "-"}</td>
                    <td style={{ ...tdStyle, color: "#f8fafc" }}>${row.put?.bestAsk || "-"}</td>
                    <td style={{ ...tdStyle, color: "#ef4444" }}>{row.put?.theta || "-"}</td>
                    <td style={{ ...tdStyle, color: "#ef4444" }}>{row.put?.delta || "-"}</td>
                    <td style={{ ...tdStyle, color: "#94a3b8" }}>{row.put?.iv || "-"}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {row.put && (
                        <button
                          onClick={() => { setBuyModal({ instrument: row.put.instrument, type: "put", strike: row.strike, price: row.put.bestAsk }); setMessage(null); }}
                          style={{ background: "#dc2626", color: "white", border: "none", padding: "0.2rem 0.6rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.72rem" }}
                        >
                          BUY
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Open Options Positions */}
      {openOptions.length > 0 && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Open Option Positions ({openOptions.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {openOptions.map(opt => (
              <div key={opt._id} style={{ background: "#0f172a", borderRadius: "8px", padding: "0.75rem 1rem", display: "grid", gridTemplateColumns: "1fr repeat(5, auto)", gap: "1rem", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "0.85rem", color: opt.optionType === "call" ? "#22c55e" : "#ef4444" }}>
                    {opt.instrumentName}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {opt.optionType.toUpperCase()} | Qty: {opt.quantity} | Entry: ${opt.premium}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Current</div>
                  <div style={{ fontSize: "0.85rem" }}>${opt.currentPrice}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Unrealized</div>
                  <div style={{ fontSize: "0.85rem", color: opt.unrealizedPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                    {opt.unrealizedPnl >= 0 ? "+" : ""}${opt.unrealizedPnl}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>P&L%</div>
                  <div style={{ fontSize: "0.85rem", color: opt.pnlPct >= 0 ? "#22c55e" : "#ef4444" }}>
                    {opt.pnlPct >= 0 ? "+" : ""}{opt.pnlPct}%
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Delta</div>
                  <div style={{ fontSize: "0.85rem" }}>{opt.currentDelta?.toFixed(3)}</div>
                </div>
                <button
                  onClick={() => handleClose(opt._id)}
                  disabled={closing === opt._id}
                  style={{ background: "#ef4444", color: "white", border: "none", padding: "0.3rem 0.75rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  {closing === opt._id ? "..." : "Close"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {buyModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem", width: "340px" }}>
            <h3 style={{ marginBottom: "1rem" }}>
              Buy {buyModal.type.toUpperCase()} Option
            </h3>
            <div style={{ background: "#0f172a", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "#64748b" }}>Instrument</span>
                <span style={{ color: buyModal.type === "call" ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>{buyModal.instrument}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "#64748b" }}>Strike</span>
                <span>${buyModal.strike?.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "#64748b" }}>Ask Price</span>
                <span>${buyModal.price}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Expiry</span>
                <span>{selectedExpiry?.label}</span>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "0.4rem" }}>
                Quantity (min 0.1 contracts)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", padding: "0.6rem", borderRadius: "6px", fontSize: "1rem" }}
              />
              <small style={{ color: "#64748b", fontSize: "0.75rem" }}>
                Total cost: ${(buyModal.price * quantity).toFixed(2)}
              </small>
            </div>

            {message && (
              <p style={{ color: message.type === "error" ? "#ef4444" : "#22c55e", fontSize: "0.82rem", marginBottom: "0.75rem" }}>
                {message.text}
              </p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={handleBuy}
                disabled={buying}
                style={{ background: buyModal.type === "call" ? "#16a34a" : "#dc2626", color: "white", border: "none", padding: "0.75rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                {buying ? "Buying..." : `Buy ${buyModal.type.toUpperCase()}`}
              </button>
              <button
                onClick={() => { setBuyModal(null); setMessage(null); }}
                style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", padding: "0.75rem", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}