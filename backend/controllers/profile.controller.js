const User = require("../models/User.model");
const Portfolio = require("../models/Portfolio.model");
const Position = require("../models/Position.model");
const Option = require("../models/Option.model");

async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    // Auto-generate referral code for existing users who don't have one
    if (!user.referralCode) {
      const clean = user.name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newCode = `${clean}-${random}`;
      await User.findByIdAndUpdate(userId, { referralCode: newCode });
      user.referralCode = newCode;
    }

    const portfolio = await Portfolio.findOne({ userId }).lean();
    const closedPositions = await Position.find({ userId, status: "CLOSED" }).lean();
    const closedOptions = await Option.find({ userId, status: "CLOSED" }).lean();

    // Stats
    const totalFuturesTrades = closedPositions.length;
    const winningFutures = closedPositions.filter(p => p.realizedPnl > 0).length;
    const futuresWinRate = totalFuturesTrades > 0 ? +((winningFutures / totalFuturesTrades) * 100).toFixed(1) : 0;

    const totalOptionsTrades = closedOptions.length;
    const winningOptions = closedOptions.filter(o => o.realizedPnl > 0).length;
    const optionsWinRate = totalOptionsTrades > 0 ? +((winningOptions / totalOptionsTrades) * 100).toFixed(1) : 0;

    const totalTrades = totalFuturesTrades + totalOptionsTrades;
    const totalWins = winningFutures + winningOptions;
    const overallWinRate = totalTrades > 0 ? +((totalWins / totalTrades) * 100).toFixed(1) : 0;

    const bestTrade = closedPositions.length > 0
      ? Math.max(...closedPositions.map(p => p.realizedPnl))
      : 0;

    const worstTrade = closedPositions.length > 0
      ? Math.min(...closedPositions.map(p => p.realizedPnl))
      : 0;

    const totalPnl = portfolio?.realizedPnl || 0;
    const returnPct = +((totalPnl / (portfolio?.totalCapital || 10000)) * 100).toFixed(2);

    // Most traded symbol
    const symbolCount = {};
    closedPositions.forEach(p => {
      symbolCount[p.symbol] = (symbolCount[p.symbol] || 0) + 1;
    });
    const favoriteSymbol = Object.keys(symbolCount).sort((a, b) => symbolCount[b] - symbolCount[a])[0] || "—";

    return res.status(200).json({
      status: "success",
      data: {
        name: user.name,
        username: user.username || user.name.toLowerCase().replace(/\s/g, ""),
        joinedAt: user.createdAt,
        referralCode: user.referralCode,
        referralCount: user.referralCount || 0,
        referralLink: `${req.headers.origin || "https://tradershub.app"}/ref/${user.referralCode}`,
        stats: {
          totalPnl: +totalPnl.toFixed(2),
          returnPct,
          availableBalance: +(portfolio?.cashBalance || 0).toFixed(2),
          totalCapital: portfolio?.totalCapital || 10000,
          totalTrades,
          overallWinRate,
          futuresWinRate,
          optionsWinRate,
          totalFuturesTrades,
          totalOptionsTrades,
          bestTrade: +bestTrade.toFixed(2),
          worstTrade: +worstTrade.toFixed(2),
          favoriteSymbol: favoriteSymbol.replace("USDT", ""),
        },
      },
    });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function updateUsername(req, res) {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    if (!username || username.length < 3) {
      return res.status(400).json({ status: "error", message: "Username must be at least 3 characters" });
    }

    const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    const existing = await User.findOne({ username: clean, _id: { $ne: userId } });
    if (existing) {
      return res.status(400).json({ status: "error", message: "Username already taken" });
    }

    await User.findByIdAndUpdate(userId, { username: clean });
    return res.status(200).json({ status: "success", message: "Username updated" });
  } catch (err) {
    console.error("updateUsername error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { getMyProfile, updateUsername };
