const { openPosition, closePosition, getOpenPosition, getPositionHistory } = require("../services/futuresEngine");

async function openFuturesPosition(req, res) {
  try {
    const userId = req.user.id;
    const { direction, quantity } = req.body;

    if (!direction || !["LONG", "SHORT"].includes(direction.toUpperCase())) {
      return res.status(400).json({ status: "error", message: "Direction must be LONG or SHORT" });
    }
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid quantity" });
    }

    const result = await openPosition(userId, direction.toUpperCase(), Number(quantity));
    if (!result.success) return res.status(400).json({ status: "error", message: result.message });

    return res.status(200).json({ status: "success", message: result.message, position: result.position });
  } catch (err) {
    console.error("openFuturesPosition error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function closeFuturesPosition(req, res) {
  try {
    const userId = req.user.id;
    const { positionId } = req.body;

    if (!positionId) {
      return res.status(400).json({ status: "error", message: "positionId required" });
    }

    const result = await closePosition(userId, positionId);
    if (!result.success) return res.status(400).json({ status: "error", message: result.message });

    return res.status(200).json({ status: "success", message: result.message, realizedPnl: result.realizedPnl });
  } catch (err) {
    console.error("closeFuturesPosition error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function getFuturesPosition(req, res) {
  try {
    const userId = req.user.id;
    const position = await getOpenPosition(userId);
    return res.status(200).json({ status: "success", data: position });
  } catch (err) {
    console.error("getFuturesPosition error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

async function getFuturesHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = await getPositionHistory(userId);
    return res.status(200).json({ status: "success", data: history });
  } catch (err) {
    console.error("getFuturesHistory error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { openFuturesPosition, closeFuturesPosition, getFuturesPosition, getFuturesHistory };