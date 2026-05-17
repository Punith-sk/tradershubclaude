const Position = require("../models/Position.model");
const Portfolio = require("../models/Portfolio.model");

const LEVERAGE = 10;
const TAKER_FEE = 0.0004; // 0.04% per trade (Binance standard)

async function fetchBtcPrice() {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        "https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT"
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
async function openPosition(userId, direction, btcQty) {
  // Fetch live price
  const quote = await fetchBtcPrice();
  if (!quote) return { success: false, message: "Cannot fetch BTC price. Try again." };

  // LONG enters at ASK, SHORT enters at BID
  const entryPrice = direction === "LONG" ? quote.ask : quote.bid;
  const notionalValue = btcQty * entryPrice;
  const margin = notionalValue / LEVERAGE;
  const fee = notionalValue * TAKER_FEE;
  const totalCost = margin + fee;

  // Check portfolio cash
  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) return { success: false, message: "Portfolio not found" };
  if (portfolio.cashBalance < totalCost) {
    return {
      success: false,
      message: `Insufficient balance. Need $${totalCost.toFixed(2)} (margin $${margin.toFixed(2)} + fee $${fee.toFixed(2)})`,
    };
  }

  // Check no existing open position for same symbol
  const existing = await Position.findOne({ userId, symbol: "BTCUSDT", status: "OPEN" });
  if (existing) {
    return { success: false, message: "You already have an open BTC position. Close it first." };
  }

  const liquidationPrice = calcLiquidationPrice(direction, entryPrice, LEVERAGE);

  // Create position
  const position = new Position({
    userId,
    symbol: "BTCUSDT",
    direction,
    entryPrice,
    quantity: btcQty,
    leverage: LEVERAGE,
    margin,
    notionalValue,
    liquidationPrice,
    status: "OPEN",
  });

  await position.save();

  // Deduct margin + fee from cash
  portfolio.cashBalance -= totalCost;
  await portfolio.save();

  return {
    success: true,
    message: `${direction} position opened: ${btcQty} BTC at $${entryPrice.toFixed(2)} | Margin: $${margin.toFixed(2)} | Liq: $${liquidationPrice.toFixed(2)}`,
    position: position.toObject(),
  };
}

// Close an existing futures position
async function closePosition(userId, positionId) {
  const position = await Position.findOne({ _id: positionId, userId, status: "OPEN" });
  if (!position) return { success: false, message: "Open position not found" };

  const quote = await fetchBtcPrice();
  if (!quote) return { success: false, message: "Cannot fetch BTC price. Try again." };

  // LONG closes at BID, SHORT closes at ASK
  const closePrice = position.direction === "LONG" ? quote.bid : quote.ask;
  const fee = position.notionalValue * TAKER_FEE;
  const realizedPnl = calcRealizedPnl(position.direction, position.entryPrice, closePrice, position.quantity);
  const returnToWallet = position.margin + realizedPnl - fee;

  // Update position
  position.status = "CLOSED";
  position.closePrice = closePrice;
  position.realizedPnl = realizedPnl;
  position.closedAt = new Date();
  await position.save();

  // Return margin + PnL to portfolio
  const portfolio = await Portfolio.findOne({ userId });
  portfolio.cashBalance += Math.max(returnToWallet, 0); // can't go below 0
  portfolio.realizedPnl += realizedPnl;
  await portfolio.save();

  return {
    success: true,
    message: `Position closed at $${closePrice.toFixed(2)} | PnL: ${realizedPnl >= 0 ? "+" : ""}$${realizedPnl.toFixed(2)}`,
    realizedPnl,
    closePrice,
  };
}

// Get open position with live PnL
async function getOpenPosition(userId) {
  const position = await Position.findOne({ userId, symbol: "BTCUSDT", status: "OPEN" }).lean();
  if (!position) return null;

  const quote = await fetchBtcPrice();
  const currentPrice = quote ? quote.ltp : position.entryPrice;
  const unrealizedPnl = calcUnrealizedPnl(position.direction, position.entryPrice, currentPrice, position.quantity);
  const pnlPct = (unrealizedPnl / position.margin) * 100;

  // Check liquidation
  const isLiquidated =
    position.direction === "LONG"
      ? currentPrice <= position.liquidationPrice
      : currentPrice >= position.liquidationPrice;

  return {
    ...position,
    currentPrice,
    unrealizedPnl: +unrealizedPnl.toFixed(2),
    pnlPct: +pnlPct.toFixed(2),
    isLiquidated,
  };
}

// Get position history
async function getPositionHistory(userId) {
  return Position.find({ userId, status: "CLOSED" })
    .sort({ closedAt: -1 })
    .limit(50)
    .lean();
}

module.exports = { openPosition, closePosition, getOpenPosition, getPositionHistory, fetchBtcPrice };