const mongoose = require("mongoose");

const CompetitionSchema = new mongoose.Schema({
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  winners: [
    {
      rank: Number,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      username: String,
      returnPct: Number,
      realizedPnl: Number,
      totalTrades: Number,
      winRate: Number,
      badge: String, // "🥇", "🥈", "🥉"
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("Competition", CompetitionSchema);