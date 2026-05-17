const Position = require("../models/Position.model");
const Portfolio = require("../models/Portfolio.model");

const LEVERAGE = 10;
const TAKER_FEE = 0.0004;

const SUPPORTED_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];

async function fetchPrice(symbol = "BTCUSDT") {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`
      );
      const data = await res.json();
      return {
        bid: parseFloat(data.bidPrice),
        ask: parseFloat(data.askPrice),
        ltp: (parseFloat(data.bidPrice) + parseFloat(data.askPrice)) / 2,
      };
    } catch (err) {
      if (attempt === MAX_RETRIES) return null;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
  return null;
}

function calcLiquidationPrice(direction, entryPrice, leverage) {
  if (direction === "LONG") {
    return entryPrice * (1 - 1 / leverage + 0.005);
  } else {
    return entryPrice * (1 + 1 / leverage - 0.005);
  }
}

function calcUnrealizedPnl(direction, entryPrice, currentPrice, quantity) {
  if (direction === "LONG") {
    return (currentPrice - entryPrice) * quantity;
  } else {
    return (entryPrice - currentPrice) * quantity;
  }
}

function calcRealizedPnl(direction, entryPrice, closePrice, quantity) {
  if (direction === "LONG") {
    return (closePrice - entryPrice) * quantity;
  } else {
    return (entryPrice - closePrice) * quantity;
  }
}

// Open a new futures position
async function openPosition(userId, direction, quantity, symbol = "BTCUSDT") {
  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return { success: false, message: `Unsupported symbol. Choose from: ${SUPPORTED_SYMBOLS.join(", ")}` };
  }

  const quote = await fetchPrice(symbol);
  if (!quote) return { success: false, message: "Cannot fetch price. Try again." };

  const entryPrice = direction === "LONG" ? quote.ask : quote.bid;
  const notionalValue = quantity * entryPrice;
  const margin = notionalValue / LEVERAGE;
  const fee = notionalValue * TAKER_FEE;
  const totalCost = margin + fee;

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) return { success: false, message: "Portfolio not found" };
  if (portfolio.cashBalance < totalCost) {
    return { success: false, message: `Insufficient balance. Need $${totalCost.toFixed(2)} (margin $${margin.toFixed(2)} + fee $${fee.toFixed(2)})` };
  }

  const existing = await Position.findOne({ userId, symbol, status: "OPEN" });
  if (existing) {
    return { success: false, message: `You already have an open ${symbol} position. Close it first.` };
  }

  const liquidationPrice = calcLiquidationPrice(direction, entryPrice, LEVERAGE);

  const position = new Position({
    userId, symbol, direction,
    entryPrice, quantity, leverage: LEVERAGE,
    margin, notionalValue, liquidationPrice,
    status: "OPEN",
  });

  await position.save();

  portfolio.cashBalance -= totalCost;
  await portfolio.save();

  return {
    success: true,
    message: `${direction} ${symbol} opened: ${quantity} @ $${entryPrice.toFixed(2)} | Margin: $${margin.toFixed(2)} | Liq: $${liquidationPrice.toFixed(2)}`,
    position: position.toObject(),
  };
}

async function closePosition(userId, positionId) {
  const position = await Position.findOne({ _id: positionId, userId, status: "OPEN" });
  if (!position) return { success: false, message: "Open position not found" };

  const quote = await fetchPrice(position.symbol);
  if (!quote) return { success: false, message: "Cannot fetch price. Try again." };

  const closePrice = position.direction === "LONG" ? quote.bid : quote.ask;
  const fee = position.notionalValue * TAKER_FEE;
  const realizedPnl = calcRealizedPnl(position.direction, position.entryPrice, closePrice, position.quantity);
  const returnToWallet = position.margin + realizedPnl - fee;

  position.status = "CLOSED";
  position.closePrice = closePrice;
  position.realizedPnl = realizedPnl;
  position.closedAt = new Date();
  await position.save();

  const portfolio = await Portfolio.findOne({ userId });
  portfolio.cashBalance += Math.max(returnToWallet, 0);
  portfolio.realizedPnl += realizedPnl;
  await portfolio.save();

  return {
    success: true,
    message: `Closed at $${closePrice.toFixed(2)} | PnL: ${realizedPnl >= 0 ? "+" : ""}$${realizedPnl.toFixed(2)}`,
    realizedPnl, closePrice,
  };
}

async function getOpenPositions(userId) {
  const positions = await Position.find({ userId, status: "OPEN" }).lean();
  const results = [];

  for (const position of positions) {
    const quote = await fetchPrice(position.symbol);
    const currentPrice = quote ? quote.ltp : position.entryPrice;
    const unrealizedPnl = calcUnrealizedPnl(position.direction, position.entryPrice, currentPrice, position.quantity);
    const pnlPct = (unrealizedPnl / position.margin) * 100;
    const isLiquidated = position.direction === "LONG"
      ? currentPrice <= position.liquidationPrice
      : currentPrice >= position.liquidationPrice;

    results.push({ ...position, currentPrice, unrealizedPnl: +unrealizedPnl.toFixed(2), pnlPct: +pnlPct.toFixed(2), isLiquidated });
  }

  return results;
}

async function getPositionHistory(userId) {
  return Position.find({ userId, status: "CLOSED" })
    .sort({ closedAt: -1 }).limit(50).lean();
}

module.exports = { openPosition, closePosition, getOpenPositions, getPositionHistory, fetchPrice, SUPPORTED_SYMBOLS };