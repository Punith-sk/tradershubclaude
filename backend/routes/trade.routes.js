const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  placeBuy,
  placeSell,
  getPortfolio,
  getTradeHistory,
} = require("../controllers/trade.controller");

// All routes below require a valid JWT
router.post("/trades/buy", auth, placeBuy);
router.post("/trades/sell", auth, placeSell);
router.get("/portfolio", auth, getPortfolio);
router.get("/trades", auth, getTradeHistory);

module.exports = router;
