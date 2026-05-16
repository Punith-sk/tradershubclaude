// models/Trade.model.js
// Translated from OpenAlgo: sandbox_db.py → SandboxTrades + SandboxOrders
// Simplified for TradersHub (Bitcoin only, MARKET orders only for MVP)

const mongoose = require("mongoose");

const TradeSchema = new mongoose.Schema(
  {
    // Unique IDs — mirrors OpenAlgo's tradeid/orderid pattern
    tradeId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Trade details
    symbol: {
      type: String,
      default: "BTCUSDT",
      required: true,
    },
    action: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    // Quantity in BTC (e.g. 0.001 BTC)
    quantity: {
      type: Number,
      required: true,
      min: 0.00001, // minimum BTC trade size
    },

    // Execution price in USDT at the time of trade
    // From OpenAlgo execution_engine.py: "execution_price = ask if ask > 0 else ltp"
    executionPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total trade value = quantity × executionPrice
    tradeValue: {
      type: Number,
      required: true,
    },

    // For SELL trades: P&L realized at time of this trade
    // From OpenAlgo execution_engine.py → _calculate_realized_pnl():
    //   long:  pnl = (close_price - avg_price) * close_quantity
    //   short: pnl = (avg_price - close_price) * close_quantity
    realizedPnl: {
      type: Number,
      default: 0, // 0 for BUY trades; calculated for SELL trades
    },

    // Snapshot of avgBuyPrice at time of this trade (useful for history display)
    avgBuyPriceAtTrade: {
      type: Number,
      default: 0,
    },

    // Order status — from OpenAlgo SandboxOrders order_status
    status: {
      type: String,
      enum: ["complete", "rejected", "cancelled"],
      default: "complete",
    },

    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index for fast user trade history queries
TradeSchema.index({ userId: 1, createdAt: -1 });

// Generate trade ID — mirrors OpenAlgo's _generate_trade_id():
// "TRADE-{YYYYMMDD-HHMMSS}-{uuid[:8]}"
TradeSchema.statics.generateTradeId = function () {
  const now = new Date();
  const datePart = now
    .toISOString()
    .replace(/[-T:]/g, "")
    .slice(0, 15)
    .replace(".", "-");
  const uniquePart = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `TRADE-${datePart}-${uniquePart}`;
};

module.exports = mongoose.model("Trade", TradeSchema);
