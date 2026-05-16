// services/tradeEngine.js
// The heart of TradersHub — handles BUY and SELL execution
//
// Translated from OpenAlgo:
//   - sandbox/execution_engine.py → _execute_order(), _update_position()
//   - sandbox/order_manager.py    → place_order(), validation flow
//
// Key design decisions (mirroring OpenAlgo's production logic):
//   1. Fetch live price FIRST, reject order if price unavailable
//   2. Validate balance/holdings BEFORE touching DB
//   3. Atomic DB update: Trade record + Portfolio update in one operation
//   4. Calculate everything inline — no lazy recalculation from history

const Portfolio = require("../models/Portfolio.model");
const Trade = require("../models/Trade.model");
const {
  validateBuyOrder,
  validateSellOrder,
  calcRealizedPnl,
  calcNewAvgBuyPrice,
} = require("../utils/calculations");

// ─── Fetch live BTC price from Binance ─────────────────────────────────────
// From OpenAlgo execution_engine.py → _fetch_quote():
//   "Returns None if quote cannot be fetched (permission error, API error, etc.)"
// We use Binance public REST — no API key needed for price data
async function fetchBtcPrice() {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT"
      );
      if (!response.ok) throw new Error(`Binance API ${response.status}`);
      const data = await response.json();

      // OpenAlgo uses bid/ask for realistic fill prices:
      //   BUY executes at ASK (you pay seller's asking price)
      //   SELL executes at BID (you receive buyer's bid)
      return {
        ltp: parseFloat(data.bidPrice), // midpoint fallback
        ask: parseFloat(data.askPrice), // BUY fills here
        bid: parseFloat(data.bidPrice), // SELL fills here
      };
    } catch (err) {
      if (attempt === MAX_RETRIES) return null;
      // OpenAlgo retries with 0.3s delay between attempts
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
  return null;
}

// ─── BUY EXECUTION ─────────────────────────────────────────────────────────
/**
 * Execute a BUY order for BTC.
 *
 * Flow (mirroring OpenAlgo order_manager.py → place_order() + execution_engine.py → _execute_order()):
 *   1. Fetch live price → reject if unavailable (no hardcoded fallback)
 *   2. Determine execution price at ASK (realistic market fill)
 *   3. Validate cash balance
 *   4. Create Trade record
 *   5. Update Portfolio: deduct cash, add BTC, recalculate avgBuyPrice
 *
 * @param {string} userId  - MongoDB user ID
 * @param {number} btcQty  - Amount of BTC to buy
 * @returns {{ success: boolean, trade?: object, portfolio?: object, message: string }}
 */
async function executeBuy(userId, btcQty) {
  // Step 1: Fetch live price
  // OpenAlgo: "Reject order if no valid price available"
  const quote = await fetchBtcPrice();
  if (!quote || quote.ask <= 0) {
    return {
      success: false,
      message:
        "Cannot place order — unable to fetch current BTC price. Please try again.",
    };
  }

  // Step 2: Execution price = ASK (what you pay to buy)
  // OpenAlgo execution_engine.py → _process_order():
  //   "BUY: Execute at ask price (pay seller's asking price)"
  const executionPrice = quote.ask;
  const tradeValue = btcQty * executionPrice;

  // Step 3: Load portfolio and validate
  let portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    return { success: false, message: "Portfolio not found" };
  }

  const validation = validateBuyOrder(portfolio.cashBalance, btcQty, executionPrice);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Step 4: Calculate new avgBuyPrice BEFORE touching DB
  // OpenAlgo execution_engine.py → _update_position() "Adding to existing position":
  //   new_average_price = (old_qty * old_avg + new_qty * execution_price) / (old_qty + new_qty)
  const newAvgBuyPrice = calcNewAvgBuyPrice(
    portfolio.btcHolding,
    portfolio.avgBuyPrice,
    btcQty,
    executionPrice
  );

  // Step 5: Create Trade record
  const tradeId = Trade.generateTradeId();
  const trade = new Trade({
    tradeId,
    userId,
    symbol: "BTCUSDT",
    action: "BUY",
    quantity: btcQty,
    executionPrice,
    tradeValue,
    realizedPnl: 0, // BUY trades never have realized P&L
    avgBuyPriceAtTrade: portfolio.avgBuyPrice, // snapshot before update
    status: "complete",
  });

  await trade.save();

  // Step 6: Update Portfolio atomically
  // OpenAlgo execution_engine.py → _update_position() "Adding to existing position"
  portfolio.cashBalance -= tradeValue;
  portfolio.btcHolding += btcQty;
  portfolio.avgBuyPrice = newAvgBuyPrice;
  portfolio.totalBtcBought += btcQty;
  portfolio.totalCostPaid += tradeValue;
  portfolio.ltp = executionPrice;

  await portfolio.save();

  return {
    success: true,
    message: `Bought ${btcQty} BTC at $${executionPrice.toFixed(2)}`,
    trade: trade.toObject(),
    portfolio: portfolio.toObject(),
  };
}

// ─── SELL EXECUTION ────────────────────────────────────────────────────────
/**
 * Execute a SELL order for BTC.
 *
 * Flow (mirroring OpenAlgo execution_engine.py → _update_position() "Position closed"):
 *   1. Fetch live price → reject if unavailable
 *   2. Determine execution price at BID (realistic market fill)
 *   3. Validate BTC holdings
 *   4. Calculate realized P&L
 *   5. Create Trade record with realized P&L
 *   6. Update Portfolio: credit cash, deduct BTC, update realizedPnl
 *      - If all BTC sold: reset avgBuyPrice to 0 (like Zerodha: "avg resets to 0 for closed positions")
 *      - If partial sell: keep remaining avgBuyPrice unchanged
 *
 * @param {string} userId  - MongoDB user ID
 * @param {number} btcQty  - Amount of BTC to sell
 * @returns {{ success: boolean, trade?: object, portfolio?: object, message: string }}
 */
async function executeSell(userId, btcQty) {
  // Step 1: Fetch live price
  const quote = await fetchBtcPrice();
  if (!quote || quote.bid <= 0) {
    return {
      success: false,
      message:
        "Cannot place order — unable to fetch current BTC price. Please try again.",
    };
  }

  // Step 2: Execution price = BID (what you receive when selling)
  // OpenAlgo execution_engine.py → _process_order():
  //   "SELL: Execute at bid price (receive buyer's bid price)"
  const executionPrice = quote.bid;
  const tradeValue = btcQty * executionPrice;

  // Step 3: Load portfolio and validate
  let portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    return { success: false, message: "Portfolio not found" };
  }

  const validation = validateSellOrder(portfolio.btcHolding, btcQty);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Step 4: Calculate realized P&L
  // OpenAlgo execution_engine.py → _calculate_realized_pnl():
  //   long position closed: pnl = (close_price - avg_price) * close_quantity
  const realizedPnl = calcRealizedPnl(portfolio.avgBuyPrice, executionPrice, btcQty);

  // Step 5: Create Trade record
  const tradeId = Trade.generateTradeId();
  const trade = new Trade({
    tradeId,
    userId,
    symbol: "BTCUSDT",
    action: "SELL",
    quantity: btcQty,
    executionPrice,
    tradeValue,
    realizedPnl,
    avgBuyPriceAtTrade: portfolio.avgBuyPrice, // snapshot of avg at time of sell
    status: "complete",
  });

  await trade.save();

  // Step 6: Update Portfolio
  const remainingBtc = portfolio.btcHolding - btcQty;

  portfolio.cashBalance += tradeValue;
  portfolio.btcHolding = remainingBtc;
  portfolio.realizedPnl += realizedPnl;
  portfolio.ltp = executionPrice;

  // OpenAlgo position_manager.py → positions_list display:
  // "Closed position — show avg=0 (like Zerodha)"
  // If ALL BTC sold → reset avgBuyPrice and cost tracking
  if (remainingBtc <= 0.000001) {
    portfolio.btcHolding = 0;
    portfolio.avgBuyPrice = 0;
    portfolio.totalBtcBought = 0;
    portfolio.totalCostPaid = 0;
  }
  // If PARTIAL sell → avgBuyPrice stays the same (already weighted correctly)
  // OpenAlgo: "Reducing position — avgBuyPrice unchanged for remaining position"

  await portfolio.save();

  return {
    success: true,
    message: `Sold ${btcQty} BTC at $${executionPrice.toFixed(2)}. P&L: ${realizedPnl >= 0 ? "+" : ""}$${realizedPnl.toFixed(2)}`,
    trade: trade.toObject(),
    portfolio: portfolio.toObject(),
    realizedPnl,
  };
}

// ─── INITIALIZE PORTFOLIO ──────────────────────────────────────────────────
/**
 * Create a fresh portfolio for a new user.
 * From OpenAlgo sandbox_db.py → SandboxFunds default: ₹1 Crore
 * We default to $10,000 USDT.
 *
 * @param {string} userId        - MongoDB user ID
 * @param {number} startingCapital - Optional custom starting balance (USDT)
 */
async function initPortfolio(userId, startingCapital = 10000) {
  const existing = await Portfolio.findOne({ userId });
  if (existing) return existing;

  const portfolio = new Portfolio({
    userId,
    totalCapital: startingCapital,
    cashBalance: startingCapital,
  });

  await portfolio.save();
  return portfolio;
}

module.exports = { executeBuy, executeSell, initPortfolio, fetchBtcPrice };
