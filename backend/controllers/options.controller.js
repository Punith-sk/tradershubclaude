const { getExpiries, getOptionsChain, getOptionTicker } = require("../services/optionsService");
const Option = require("../models/Option.model");
const Portfolio = require("../models/Portfolio.model");

async function fetchExpiries(req, res) {
  try {
    const expiries = await getExpiries();
    return res.status(200).json({ status: "success", data: expiries });
  } catch (err) {
    console.error("fetchExpiries error:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch expiries" });
  }
}

async function fetchChain(req, res) {
  try {
    const { expiry } = req.query;
    if (!expiry) return res.status(400).json({ status: "error", message: "expiry required" });
    const result = await getOptionsChain(expiry);
    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    console.error("fetchChain error:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch options chain" });
  }
}

async function buyOption(req, res) {
  try {
    const userId = req.user.id;
    const { instrumentName, quantity, optionType, strike, expiry, expiryLabel } = req.body;

    if (!instrumentName || !quantity || !optionType || !strike || !expiry) {
      return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    // Fetch current price for this option
    const ticker = await getOptionTicker(instrumentName);
    if (!ticker) return res.status(400).json({ status: "error", message: "Cannot fetch option price" });

    // Get BTC price for USD conversion
    const btcPriceRes = await fetch("https://www.deribit.com/api/v2/public/get_index_price?index_name=btc_usd");
    const btcPriceData = await btcPriceRes.json();
    const btcPrice = btcPriceData.result.index_price;

    const premiumInBtc = ticker.best_ask_price || ticker.mark_price;
    const premiumInUsd = +(premiumInBtc * btcPrice).toFixed(2);
    const totalCost = +(premiumInUsd * quantity).toFixed(2);

    // Check portfolio balance
    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) return res.status(404).json({ status: "error", message: "Portfolio not found" });
    if (portfolio.cashBalance < totalCost) {
      return res.status(400).json({
        status: "error",
        message: `Insufficient balance. Need $${totalCost} but have $${portfolio.cashBalance.toFixed(2)}`
      });
    }

    // Create option position
    const option = new Option({
      userId,
      instrumentName,
      symbol: "BTC",
      optionType,
      strike,
      expiry: new Date(parseInt(expiry)),
      expiryLabel,
      quantity,
      premium: premiumInUsd,
      totalCost,
      deltaAtEntry: ticker.greeks?.delta || 0,
      gammaAtEntry: ticker.greeks?.gamma || 0,
      thetaAtEntry: ticker.greeks?.theta || 0,
      vegaAtEntry: ticker.greeks?.vega || 0,
      ivAtEntry: ticker.mark_iv || 0,
      status: "OPEN",
    });

    await option.save();

    // Deduct from portfolio
    portfolio.cashBalance -= totalCost;
    await portfolio.save();

    return res.status(200).json({
      status: "success",
      message: `Bought ${quantity} × ${instrumentName} @ $${premiumInUsd} | Total: $${totalCost}`,
      option: option.toObject(),
    });
  } catch (err) {
    console.error("buyOption error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function closeOption(req, res) {
  try {
    const userId = req.user.id;
    const { optionId } = req.body;

    const option = await Option.findOne({ _id: optionId, userId, status: "OPEN" });
    if (!option) return res.status(404).json({ status: "error", message: "Open option not found" });

    // Fetch current price
    const ticker = await getOptionTicker(option.instrumentName);
    const btcPriceRes = await fetch("https://www.deribit.com/api/v2/public/get_index_price?index_name=btc_usd");
    const btcPriceData = await btcPriceRes.json();
    const btcPrice = btcPriceData.result.index_price;

    const closePriceInUsd = +((ticker.best_bid_price || ticker.mark_price) * btcPrice).toFixed(2);
    const proceeds = +(closePriceInUsd * option.quantity).toFixed(2);
    const realizedPnl = +(proceeds - option.totalCost).toFixed(2);

    // Update option
    option.status = "CLOSED";
    option.closePrice = closePriceInUsd;
    option.realizedPnl = realizedPnl;
    option.closedAt = new Date();
    await option.save();

    // Return proceeds to portfolio
    const portfolio = await Portfolio.findOne({ userId });
    portfolio.cashBalance += proceeds;
    portfolio.realizedPnl += realizedPnl;
    await portfolio.save();

    return res.status(200).json({
      status: "success",
      message: `Option closed at $${closePriceInUsd} | PnL: ${realizedPnl >= 0 ? "+" : ""}$${realizedPnl}`,
      realizedPnl,
    });
  } catch (err) {
    console.error("closeOption error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function getOpenOptions(req, res) {
  try {
    const userId = req.user.id;
    const options = await Option.find({ userId, status: "OPEN" }).lean();

    // Enrich with live prices
    const enriched = await Promise.all(options.map(async (opt) => {
      try {
        const ticker = await getOptionTicker(opt.instrumentName);
        const btcPriceRes = await fetch("https://www.deribit.com/api/v2/public/get_index_price?index_name=btc_usd");
        const btcPriceData = await btcPriceRes.json();
        const btcPrice = btcPriceData.result.index_price;

        const currentPrice = +((ticker.mark_price) * btcPrice).toFixed(2);
        const unrealizedPnl = +((currentPrice - opt.premium) * opt.quantity).toFixed(2);
        const pnlPct = +(((unrealizedPnl / opt.totalCost) * 100).toFixed(2));

        return {
          ...opt,
          currentPrice,
          unrealizedPnl,
          pnlPct,
          currentDelta: ticker.greeks?.delta || 0,
          currentIv: ticker.mark_iv || 0,
        };
      } catch {
        return { ...opt, currentPrice: 0, unrealizedPnl: 0, pnlPct: 0 };
      }
    }));

    return res.status(200).json({ status: "success", data: enriched });
  } catch (err) {
    console.error("getOpenOptions error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function getOptionsHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = await Option.find({ userId, status: { $in: ["CLOSED", "EXPIRED"] } })
      .sort({ closedAt: -1 }).limit(50).lean();
    return res.status(200).json({ status: "success", data: history });
  } catch (err) {
    console.error("getOptionsHistory error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { fetchExpiries, fetchChain, buyOption, closeOption, getOpenOptions, getOptionsHistory };