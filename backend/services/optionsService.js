const DERIBIT_BASE = "https://www.deribit.com/api/v2/public";

// Get all active BTC option expiries
async function getExpiries() {
  const res = await fetch(
    `${DERIBIT_BASE}/get_instruments?currency=BTC&kind=option&expired=false`
  );
  const data = await res.json();
  const instruments = data.result;

  // Get unique expiry dates
  const expiries = [...new Set(instruments.map(i => i.expiration_timestamp))]
    .sort((a, b) => a - b)
    .slice(0, 6) // next 6 expiries only
    .map(ts => ({
      timestamp: ts,
      label: new Date(ts).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      }),
    }));

  return expiries;
}

// Get options chain for a specific expiry
async function getOptionsChain(expiryTimestamp) {
  // Get all instruments for this expiry
  const res = await fetch(
    `${DERIBIT_BASE}/get_instruments?currency=BTC&kind=option&expired=false`
  );
  const data = await res.json();

  const instruments = data.result.filter(
    i => i.expiration_timestamp === parseInt(expiryTimestamp)
  );

  if (instruments.length === 0) return [];

  // Get current BTC price
  const priceRes = await fetch(
    `${DERIBIT_BASE}/get_index_price?index_name=btc_usd`
  );
  const priceData = await priceRes.json();
  const btcPrice = priceData.result.index_price;

  // Get unique strikes — filter to ATM range (±20% from current price)
  const strikes = [...new Set(instruments.map(i => i.strike))]
    .filter(s => s >= btcPrice * 0.8 && s <= btcPrice * 1.2)
    .sort((a, b) => a - b);

  // Fetch ticker data for each instrument
  const chain = await Promise.all(
    strikes.map(async (strike) => {
      const call = instruments.find(i => i.strike === strike && i.option_type === "call");
      const put = instruments.find(i => i.strike === strike && i.option_type === "put");

      let callData = null;
      let putData = null;

      if (call) {
        try {
          const r = await fetch(`${DERIBIT_BASE}/get_order_book?instrument_name=${call.instrument_name}&depth=1`);
          const d = await r.json();
          const ob = d.result;
          callData = {
            instrument: call.instrument_name,
            iv: ob.mark_iv ? +ob.mark_iv.toFixed(2) : 0,
            delta: ob.greeks?.delta ? +ob.greeks.delta.toFixed(4) : 0,
            gamma: ob.greeks?.gamma ? +ob.greeks.gamma.toFixed(6) : 0,
            theta: ob.greeks?.theta ? +ob.greeks.theta.toFixed(4) : 0,
            vega: ob.greeks?.vega ? +ob.greeks.vega.toFixed(4) : 0,
            markPrice: ob.mark_price ? +(ob.mark_price * btcPrice).toFixed(2) : 0,
            bestBid: ob.best_bid_price ? +(ob.best_bid_price * btcPrice).toFixed(2) : 0,
            bestAsk: ob.best_ask_price ? +(ob.best_ask_price * btcPrice).toFixed(2) : 0,
            volume: ob.stats?.volume || 0,
            openInterest: ob.open_interest || 0,
          };
        } catch { callData = null; }
      }

      if (put) {
        try {
          const r = await fetch(`${DERIBIT_BASE}/get_order_book?instrument_name=${put.instrument_name}&depth=1`);
          const d = await r.json();
          const ob = d.result;
          putData = {
            instrument: put.instrument_name,
            iv: ob.mark_iv ? +ob.mark_iv.toFixed(2) : 0,
            delta: ob.greeks?.delta ? +ob.greeks.delta.toFixed(4) : 0,
            gamma: ob.greeks?.gamma ? +ob.greeks.gamma.toFixed(6) : 0,
            theta: ob.greeks?.theta ? +ob.greeks.theta.toFixed(4) : 0,
            vega: ob.greeks?.vega ? +ob.greeks.vega.toFixed(4) : 0,
            markPrice: ob.mark_price ? +(ob.mark_price * btcPrice).toFixed(2) : 0,
            bestBid: ob.best_bid_price ? +(ob.best_bid_price * btcPrice).toFixed(2) : 0,
            bestAsk: ob.best_ask_price ? +(ob.best_ask_price * btcPrice).toFixed(2) : 0,
            volume: ob.stats?.volume || 0,
            openInterest: ob.open_interest || 0,
          };
        } catch { putData = null; }
      }

      return {
        strike,
        isATM: Math.abs(strike - btcPrice) < (strikes[1] - strikes[0]) * 0.6,
        call: callData,
        put: putData,
      };
    })
  );

  return { chain: chain.filter(r => r.call || r.put), btcPrice };
}

// Get live ticker for a specific instrument
async function getOptionTicker(instrumentName) {
  const res = await fetch(
    `${DERIBIT_BASE}/get_order_book?instrument_name=${instrumentName}&depth=1`
  );
  const data = await res.json();
  return data.result;
}

module.exports = { getExpiries, getOptionsChain, getOptionTicker };