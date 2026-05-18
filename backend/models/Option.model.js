const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Deribit instrument name e.g. "BTC-30MAY25-70000-P"
    instrumentName: { type: String, required: true },

    // Option details
    symbol: { type: String, default: "BTC" },
    optionType: { type: String, enum: ["call", "put"], required: true },
    strike: { type: Number, required: true },
    expiry: { type: Date, required: true },
    expiryLabel: { type: String },

    // Trade details
    action: { type: String, enum: ["BUY"], default: "BUY" }, // MVP: buy only
    quantity: { type: Number, required: true }, // number of contracts (min 0.1)
    premium: { type: Number, required: true }, // price paid per contract in USD
    totalCost: { type: Number, required: true }, // premium × quantity

    // Greeks at time of purchase
    deltaAtEntry: { type: Number, default: 0 },
    gammaAtEntry: { type: Number, default: 0 },
    thetaAtEntry: { type: Number, default: 0 },
    vegaAtEntry: { type: Number, default: 0 },
    ivAtEntry: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "EXPIRED"],
      default: "OPEN",
    },

    // Closing details
    closePrice: { type: Number, default: null },
    realizedPnl: { type: Number, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

OptionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Option", OptionSchema);