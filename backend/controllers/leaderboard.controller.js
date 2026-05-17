const User = require("../models/User.model");
const Portfolio = require("../models/Portfolio.model");
const Position = require("../models/Position.model");

async function getLeaderboard(req, res) {
  try {
    // Get all portfolios
    const portfolios = await Portfolio.find({}).lean();

    // Get closed positions for win rate calculation
    const leaderboard = await Promise.all(
      portfolios.map(async (portfolio) => {
        // Get user info
        const user = await User.findById(portfolio.userId).lean();
        if (!user) return null;

        // Get all closed positions for this user
        const closedPositions = await Position.find({
          userId: portfolio.userId,
          status: "CLOSED",
        }).lean();

        const totalTrades = closedPositions.length;
        const winningTrades = closedPositions.filter((p) => p.realizedPnl > 0).length;
        const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;

        // Total P&L including open position unrealized
        const realizedPnl = portfolio.realizedPnl || 0;

        return {
          userId: portfolio.userId,
          name: user.name,
          username: user.username || user.name.toLowerCase().replace(/\s/g, ""),
          realizedPnl: +realizedPnl.toFixed(2),
          totalTrades,
          winRate: +winRate,
          availableBalance: +portfolio.cashBalance.toFixed(2),
          totalCapital: portfolio.totalCapital,
          returnPct: +(((realizedPnl / portfolio.totalCapital) * 100).toFixed(2)),
        };
      })
    );

    // Filter nulls, sort by realizedPnl descending
    const sorted = leaderboard
      .filter(Boolean)
      .sort((a, b) => b.realizedPnl - a.realizedPnl);

    // Add rank
    const ranked = sorted.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return res.status(200).json({ status: "success", data: ranked });
  } catch (err) {
    console.error("getLeaderboard error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { getLeaderboard };