const mongoose = require("mongoose");

const PositionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: { type: String, default: "BTCUSDT" },
    direction: { type: String, enum: ["LONG", "SHORT"], required: true },

    // Entry details
    entryPrice: { type: Number, required: true },
    quantity: { type: Number, required: true }, // BTC amount
    leverage: { type: Number, default: 10 },

    // Margin locked for this position
    margin: { type: Number, required: true },

    // Notional value = quantity × entryPrice
    notionalValue: { type: Number, required: true },

    // Liquidation price
    // LONG:  liquidationPrice = entryPrice × (1 - 1/leverage + 0.005)
    // SHORT: liquidationPrice = entryPrice × (1 + 1/leverage - 0.005)
    liquidationPrice: { type: Number, required: true },

    // Position status
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },

    // Closing details (filled when closed)
    closePrice: { type: Number, default: null },
    realizedPnl: { type: Number, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for fast open position queries
PositionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Position", PositionSchema);