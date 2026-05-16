// utils/calculations.js
// Pure functions — no DB calls, fully testable
// Translated from OpenAlgo:
//   - sandbox/position_manager.py → _calculate_position_pnl(), _calculate_pnl_percent(), _calculate_realized_pnl()
//   - sandbox/execution_engine.py → _update_position() netting logic

// ─── 1. UNREALIZED P&L ─────────────────────────────────────────────────────
/**
 * Live gain/loss on currently held BTC.
 *
 * OpenAlgo source: position_manager.py → _calculate_position_pnl()
 *   long: pnl = (ltp - avg_price) * quantity
 *
 * @param {number} quantity    - BTC held (e.g. 0.05)
 * @param {number} avgBuyPrice - Weighted average buy price in USDT
 * @param {number} currentPrice - Current BTC price (LTP) in USDT
 * @returns {number} Unrealized P&L in USDT
 */
function calcUnrealizedPnl(quantity, avgBuyPrice, currentPrice) {
  if (quantity <= 0 || avgBuyPrice <= 0) return 0;
  return (currentPrice - avgBuyPrice) * quantity;
}

// ─── 2. UNREALIZED P&L % ───────────────────────────────────────────────────
/**
 * OpenAlgo source: position_manager.py → _calculate_pnl_percent()
 *   long: pnl_percent = ((ltp - avg_price) / avg_price) * 100
 *
 * @param {number} avgBuyPrice  - Average entry price
 * @param {number} currentPrice - Current price (LTP)
 * @param {number} quantity     - BTC held (only used to check direction)
 * @returns {number} P&L percentage
 */
function calcUnrealizedPnlPct(avgBuyPrice, currentPrice, quantity) {
  if (avgBuyPrice <= 0 || quantity <= 0) return 0;
  return ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;
}

// ─── 3. REALIZED P&L (per SELL trade) ──────────────────────────────────────
/**
 * Locked-in profit/loss when user sells BTC.
 *
 * OpenAlgo source: execution_engine.py → _calculate_realized_pnl()
 *   long position closed: pnl = (close_price - avg_price) * close_quantity
 *
 * @param {number} avgBuyPrice - Weighted avg price at time of sell
 * @param {number} sellPrice   - Execution price of the SELL
 * @param {number} sellQty     - How much BTC was sold
 * @returns {number} Realized P&L in USDT
 */
function calcRealizedPnl(avgBuyPrice, sellPrice, sellQty) {
  return (sellPrice - avgBuyPrice) * sellQty;
}

// ─── 4. NEW AVERAGE BUY PRICE after additional BUY ─────────────────────────
/**
 * Weighted average buy price — updates every time user buys more BTC.
 *
 * OpenAlgo source: execution_engine.py → _update_position() "Adding to existing position":
 *   total_value = (abs(old_quantity) * avg_price) + (abs(new_quantity) * execution_price)
 *   total_quantity = abs(old_quantity) + abs(new_quantity)
 *   new_average_price = total_value / total_quantity
 *
 * @param {number} existingQty      - BTC already held before this buy
 * @param {number} existingAvgPrice - Current average buy price
 * @param {number} newQty           - BTC being bought now
 * @param {number} newPrice         - Execution price of this buy
 * @returns {number} New weighted average buy price
 */
function calcNewAvgBuyPrice(existingQty, existingAvgPrice, newQty, newPrice) {
  const totalValue = existingQty * existingAvgPrice + newQty * newPrice;
  const totalQty = existingQty + newQty;
  if (totalQty === 0) return 0;
  return totalValue / totalQty;
}

// ─── 5. TOTAL PORTFOLIO VALUE ───────────────────────────────────────────────
/**
 * OpenAlgo source: fund_manager.py — totalValue = available_balance + position_value
 *
 * @param {number} cashBalance  - USDT cash not in positions
 * @param {number} btcHolding   - BTC quantity held
 * @param {number} currentPrice - Current BTC price (LTP)
 * @returns {number} Total portfolio value in USDT
 */
function calcTotalPortfolioValue(cashBalance, btcHolding, currentPrice) {
  return cashBalance + btcHolding * currentPrice;
}

// ─── 6. VALIDATE BUY ORDER ─────────────────────────────────────────────────
/**
 * Before executing a BUY, check if user has enough cash.
 *
 * OpenAlgo source: order_manager.py → place_order() margin check:
 *   can_trade, margin_check_msg = fund_manager.check_margin_available(margin_required)
 *
 * @param {number} cashBalance  - Available USDT
 * @param {number} btcQty       - BTC user wants to buy
 * @param {number} currentPrice - Current BTC price
 * @param {number} minQty       - Minimum BTC order size (default 0.00001)
 * @returns {{ valid: boolean, message: string }}
 */
function validateBuyOrder(cashBalance, btcQty, currentPrice, minQty = 0.00001) {
  if (btcQty <= 0) {
    return { valid: false, message: "Quantity must be greater than 0" };
  }
  if (btcQty < minQty) {
    return { valid: false, message: `Minimum order size is ${minQty} BTC` };
  }
  const cost = btcQty * currentPrice;
  if (cost > cashBalance) {
    return {
      valid: false,
      message: `Insufficient balance. Need $${cost.toFixed(2)} USDT, have $${cashBalance.toFixed(2)} USDT`,
    };
  }
  return { valid: true, message: "OK" };
}

// ─── 7. VALIDATE SELL ORDER ────────────────────────────────────────────────
/**
 * Before executing a SELL, check if user has enough BTC.
 *
 * OpenAlgo source: order_manager.py → place_order() CNC SELL validation:
 *   if total_available <= 0 → reject
 *   if quantity > total_available → reject
 *
 * @param {number} btcHolding - BTC currently held
 * @param {number} sellQty    - BTC user wants to sell
 * @returns {{ valid: boolean, message: string }}
 */
function validateSellOrder(btcHolding, sellQty) {
  if (sellQty <= 0) {
    return { valid: false, message: "Quantity must be greater than 0" };
  }
  if (btcHolding <= 0) {
    return { valid: false, message: "No BTC holdings to sell" };
  }
  if (sellQty > btcHolding) {
    return {
      valid: false,
      message: `Cannot sell ${sellQty} BTC. Only ${btcHolding.toFixed(8)} BTC available`,
    };
  }
  return { valid: true, message: "OK" };
}

// ─── 8. PORTFOLIO ALLOCATIONS ──────────────────────────────────────────────
/**
 * How much of total value is in BTC vs cash (for pie chart display).
 *
 * @param {number} cashBalance  - USDT cash
 * @param {number} btcHolding   - BTC held
 * @param {number} currentPrice - Current BTC price
 * @returns {{ btcPct: number, cashPct: number, totalValue: number }}
 */
function calcPortfolioAllocations(cashBalance, btcHolding, currentPrice) {
  const btcValue = btcHolding * currentPrice;
  const totalValue = cashBalance + btcValue;
  if (totalValue === 0) return { btcPct: 0, cashPct: 100, totalValue: 0 };
  return {
    btcPct: (btcValue / totalValue) * 100,
    cashPct: (cashBalance / totalValue) * 100,
    totalValue,
  };
}

// ─── 9. FULL PORTFOLIO SUMMARY (one-shot for dashboard) ────────────────────
/**
 * Returns everything the dashboard needs in one call.
 * Mirrors OpenAlgo's get_open_positions() response shape.
 *
 * @param {object} portfolio    - Portfolio doc from MongoDB
 * @param {number} currentPrice - Live BTC price (LTP)
 * @returns {object} Dashboard-ready summary
 */
function calcPortfolioSummary(portfolio, currentPrice) {
  const unrealizedPnl = calcUnrealizedPnl(
    portfolio.btcHolding,
    portfolio.avgBuyPrice,
    currentPrice
  );
  const unrealizedPnlPct = calcUnrealizedPnlPct(
    portfolio.avgBuyPrice,
    currentPrice,
    portfolio.btcHolding
  );
  const totalPnl = portfolio.realizedPnl + unrealizedPnl;
  const alloc = calcPortfolioAllocations(
    portfolio.cashBalance,
    portfolio.btcHolding,
    currentPrice
  );

  return {
    // Funds
    totalCapital: portfolio.totalCapital,
    cashBalance: portfolio.cashBalance,
    totalValue: alloc.totalValue,

    // Position
    btcHolding: portfolio.btcHolding,
    avgBuyPrice: portfolio.avgBuyPrice,
    ltp: currentPrice,

    // P&L
    unrealizedPnl: +unrealizedPnl.toFixed(2),
    unrealizedPnlPct: +unrealizedPnlPct.toFixed(4),
    realizedPnl: +portfolio.realizedPnl.toFixed(2),
    totalPnl: +totalPnl.toFixed(2),

    // Allocations
    btcAllocationPct: +alloc.btcPct.toFixed(2),
    cashAllocationPct: +alloc.cashPct.toFixed(2),
  };
}

module.exports = {
  calcUnrealizedPnl,
  calcUnrealizedPnlPct,
  calcRealizedPnl,
  calcNewAvgBuyPrice,
  calcTotalPortfolioValue,
  validateBuyOrder,
  validateSellOrder,
  calcPortfolioAllocations,
  calcPortfolioSummary,
};
