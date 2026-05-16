import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function TradeHistory() {
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getTradeHistory()
      .then(res => {
        console.log("Trade history response:", res); // debug
        if (res.status === "success") {
          setTrades(res.data);
        } else {
          setError(res.message);
        }
      })
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="trade-history">
      <h3>Trade History</h3>
      {error && <p style={{color:"red"}}>Error: {error}</p>}
      {trades.length === 0 ? <p>No trades yet.</p> : (
        <table>
          <thead>
            <tr><th>Action</th><th>Qty (BTC)</th><th>Price</th><th>Value</th><th>P&L</th><th>Time</th></tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.tradeId}>
                <td style={{ color: t.action === "BUY" ? "#22c55e" : "#ef4444" }}>{t.action}</td>
                <td>{t.quantity.toFixed(6)}</td>
                <td>${t.executionPrice.toLocaleString()}</td>
                <td>${t.tradeValue.toFixed(2)}</td>
                <td style={{ color: t.realizedPnl >= 0 ? "#22c55e" : "#ef4444" }}>
                  {t.action === "SELL" ? (t.realizedPnl >= 0 ? "+" : "") + "$" + t.realizedPnl.toFixed(2) : "-"}
                </td>
                <td>{new Date(t.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}