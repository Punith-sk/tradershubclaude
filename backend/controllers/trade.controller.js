const { executeBuy, executeSell } = require("../services/tradeEngine");
const { calcPortfolioSummary } = require("../utils/calculations");
const Portfolio = require("../models/Portfolio.model");
const Trade = require("../models/Trade.model");

async function placeBuy(req, res) {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid quantity." });
    }
    const result = await executeBuy(userId, Number(quantity));
    if (!result.success) return res.status(400).json({ status: "error", message: result.message });
    return res.status(200).json({ status: "success", message: result.message, tradeId: result.trade.tradeId, executionPrice: result.trade.executionPrice, tradeValue: result.trade.tradeValue });
  } catch (err) {
    console.error("placeBuy error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function placeSell(req, res) {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid quantity." });
    }
    const result = await executeSell(userId, Number(quantity));
    if (!result.success) return res.status(400).json({ status: "error", message: result.message });
    return res.status(200).json({ status: "success", message: result.message, tradeId: result.trade.tradeId, executionPrice: result.trade.executionPrice, realizedPnl: result.realizedPnl });
  } catch (err) {
    console.error("placeSell error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function getPortfolio(req, res) {
  try {
    const userId = req.user.id;
    const { fetchBtcPrice } = require("../services/tradeEngine");
    const quote = await fetchBtcPrice();
    const currentPrice = quote ? quote.ltp : 0;
    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) return res.status(404).json({ status: "error", message: "Portfolio not found" });
    const summary = calcPortfolioSummary(portfolio, currentPrice);
    return res.status(200).json({ status: "success", data: summary });
  } catch (err) {
    console.error("getPortfolio error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function getTradeHistory(req, res) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const trades = await Trade.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const formatted = trades.map((t) => ({
      tradeId: t.tradeId,
      action: t.action,
      quantity: t.quantity,
      executionPrice: t.executionPrice,
      tradeValue: t.tradeValue,
      realizedPnl: t.realizedPnl,
      avgBuyPriceAtTrade: t.avgBuyPriceAtTrade,
      timestamp: t.createdAt,
    }));
    return res.status(200).json({ status: "success", data: formatted });
  } catch (err) {
    console.error("getTradeHistory error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function resetPortfolio(req, res) {
  try {
    const userId = req.user.id;
    await Trade.deleteMany({ userId });
    await Portfolio.findOneAndUpdate({ userId }, {
      cashBalance: 10000,
      btcHolding: 0,
      avgBuyPrice: 0,
      totalBtcBought: 0,
      totalCostPaid: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
      totalPnl: 0,
    });
    return res.status(200).json({ status: "success", message: "Portfolio reset to $10,000" });
  } catch (err) {
    console.error("resetPortfolio error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { placeBuy, placeSell, getPortfolio, getTradeHistory, resetPortfolio };