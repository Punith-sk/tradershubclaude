// models/Portfolio.model.js
// Translated from OpenAlgo: sandbox_db.py → SandboxPositions + SandboxFunds
// This is the CORE document — everything calculated on the fly uses fields here

const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One portfolio doc per user
      index: true,
    },

    // ─── FUNDS (from OpenAlgo SandboxFunds) ──────────────────────────────
    // Starting capital — OpenAlgo defaults ₹1 Crore, we use USDT
    // Set to e.g. 10000 USDT on account creation
    totalCapital: {
      type: Number,
      default: 10000, // $10,000 USDT starting capital
    },

    // Cash available to buy more BTC
    // Debited on BUY, credited on SELL
    // From OpenAlgo fund_manager.py: block_margin() / release_margin()
    cashBalance: {
      type: Number,
      default: 10000,
      min: 0,
    },

    // ─── POSITION (from OpenAlgo SandboxPositions) ───────────────────────
    // How much BTC the user currently holds
    btcHolding: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Weighted average buy price across all BUY trades
    // From OpenAlgo execution_engine.py → _update_position() "Adding to existing position":
    //   total_value = (abs(old_quantity) * avg_price) + (abs(new_quantity) * execution_price)
    //   total_quantity = abs(old_quantity) + abs(new_quantity)
    //   new_average_price = total_value / total_quantity
    avgBuyPrice: {
      type: Number,
      default: 0,
    },

    // Running totals for avgBuyPrice calculation — OpenAlgo stores these implicitly
    // We track them explicitly to avoid recalculating from trade history every time
    totalBtcBought: {
      type: Number,
      default: 0,
    },
    totalCostPaid: {
      type: Number,
      default: 0,
    },

    // Last known BTC price (updated on each price fetch / trade)
    // From OpenAlgo SandboxPositions: ltp (Last Traded Price)
    ltp: {
      type: Number,
      default: 0,
    },

    // ─── P&L (from OpenAlgo SandboxFunds + SandboxPositions) ─────────────

    // Locked-in profit/loss from all completed SELL trades
    // From OpenAlgo SandboxFunds: realized_pnl (all-time)
    // Accumulates with each SELL: realizedPnl += (sellPrice - avgBuyPrice) × qty
    realizedPnl: {
      type: Number,
      default: 0,
    },

    // Live gain/loss on currently held BTC — recalculated every price update
    // From OpenAlgo position_manager.py → _calculate_position_pnl():
    //   long: pnl = (ltp - avg_price) * quantity
    // NOT stored in DB — computed on the fly. Stored here as a cache only.
    unrealizedPnl: {
      type: Number,
      default: 0,
    },

    // Total P&L = realizedPnl + unrealizedPnl
    // From OpenAlgo SandboxFunds: total_pnl
    totalPnl: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── VIRTUAL: Total portfolio value ────────────────────────────────────────
// From OpenAlgo: totalValue = cashBalance + (btcHolding × ltp)
PortfolioSchema.virtual("totalValue").get(function () {
  return this.cashBalance + this.btcHolding * this.ltp;
});

// ─── VIRTUAL: BTC allocation % ─────────────────────────────────────────────
// From OpenAlgo position_manager.py → positions_list pnlpercent calculation
PortfolioSchema.virtual("btcAllocationPct").get(function () {
  const total = this.cashBalance + this.btcHolding * this.ltp;
  if (total === 0) return 0;
  return ((this.btcHolding * this.ltp) / total) * 100;
});

// ─── VIRTUAL: Cash allocation % ────────────────────────────────────────────
PortfolioSchema.virtual("cashAllocationPct").get(function () {
  const total = this.cashBalance + this.btcHolding * this.ltp;
  if (total === 0) return 0;
  return (this.cashBalance / total) * 100;
});

// ─── VIRTUAL: Unrealized P&L % ─────────────────────────────────────────────
// From OpenAlgo position_manager.py → _calculate_pnl_percent():
//   long: pnl_percent = ((ltp - avg_price) / avg_price) * 100
PortfolioSchema.virtual("unrealizedPnlPct").get(function () {
  if (this.avgBuyPrice <= 0 || this.btcHolding === 0) return 0;
  return ((this.ltp - this.avgBuyPrice) / this.avgBuyPrice) * 100;
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);
