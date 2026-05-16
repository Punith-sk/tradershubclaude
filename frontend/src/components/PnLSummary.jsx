export default function PnLSummary({ portfolio, livePrice }) {
  if (!portfolio) return null;
  const unrealized = livePrice && portfolio.btcHolding > 0
    ? (livePrice - portfolio.avgBuyPrice) * portfolio.btcHolding : 0;
  const total = portfolio.realizedPnl + unrealized;
  return (
    <div className="pnl-summary">
      <div>Realized P&L: <span style={{color: portfolio.realizedPnl >= 0 ? "green" : "red"}}>${portfolio.realizedPnl?.toFixed(2)}</span></div>
      <div>Unrealized P&L: <span style={{color: unrealized >= 0 ? "green" : "red"}}>${unrealized.toFixed(2)}</span></div>
      <div><strong>Total P&L: <span style={{color: total >= 0 ? "green" : "red"}}>${total.toFixed(2)}</span></strong></div>
    </div>
  );
}
