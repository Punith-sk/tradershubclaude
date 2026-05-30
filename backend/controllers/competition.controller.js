const Competition = require("../models/Competition.model");
const Portfolio = require("../models/Portfolio.model");
const Position = require("../models/Position.model");
const User = require("../models/User.model");

// Get start of current week (Monday midnight IST)
function getCurrentWeekStart() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const day = ist.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const weekStart = new Date(ist);
  weekStart.setDate(ist.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return new Date(weekStart.getTime() - (5.5 * 60 * 60 * 1000));
}

function getCurrentWeekEnd() {
  const start = getCurrentWeekStart();
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return end;
}

// Get current week leaderboard
async function getWeeklyLeaderboard(req, res) {
  try {
    const weekStart = getCurrentWeekStart();
    const weekEnd = getCurrentWeekEnd();

    // Get all portfolios
    const portfolios = await Portfolio.find({}).lean();

    const leaderboard = await Promise.all(
      portfolios.map(async (portfolio) => {
        const user = await User.findById(portfolio.userId).lean();
        if (!user) return null;

        // Get positions closed THIS week
        const weeklyPositions = await Position.find({
          userId: portfolio.userId,
          status: "CLOSED",
          closedAt: { $gte: weekStart, $lt: weekEnd },
        }).lean();

        const totalTrades = weeklyPositions.length;
        const winningTrades = weeklyPositions.filter(p => p.realizedPnl > 0).length;
        const winRate = totalTrades > 0 ? +((winningTrades / totalTrades) * 100).toFixed(1) : 0;
        const weeklyPnl = weeklyPositions.reduce((sum, p) => sum + (p.realizedPnl || 0), 0);
        const returnPct = +((weeklyPnl / portfolio.totalCapital) * 100).toFixed(2);

        return {
          userId: portfolio.userId,
          name: user.name,
          username: user.username || user.name.toLowerCase().replace(/\s/g, ""),
          weeklyPnl: +weeklyPnl.toFixed(2),
          returnPct,
          totalTrades,
          winRate,
        };
      })
    );

    const sorted = leaderboard
      .filter(Boolean)
      .filter(e => e.totalTrades > 0) // only show traders who traded this week
      .sort((a, b) => b.returnPct - a.returnPct);

    const ranked = sorted.map((entry, i) => ({
      rank: i + 1,
      badge: i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null,
      ...entry,
    }));

    // Time remaining
    const now = new Date();
    const msLeft = weekEnd - now;
    const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return res.status(200).json({
      status: "success",
      data: {
        rankings: ranked,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        timeLeft: { days: daysLeft, hours: hoursLeft },
        totalParticipants: ranked.length,
      },
    });
  } catch (err) {
    console.error("getWeeklyLeaderboard error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

// Get past competition winners (Hall of Fame)
async function getHallOfFame(req, res) {
  try {
    const past = await Competition.find({ status: "completed" })
      .sort({ weekEnd: -1 })
      .limit(10)
      .lean();
    return res.status(200).json({ status: "success", data: past });
  } catch (err) {
    console.error("getHallOfFame error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { getWeeklyLeaderboard, getHallOfFame };