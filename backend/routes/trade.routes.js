const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { placeBuy, placeSell, getPortfolio, getTradeHistory, resetPortfolio } = require("../controllers/trade.controller");

router.post("/trades/buy", auth, placeBuy);
router.post("/trades/sell", auth, placeSell);
router.get("/portfolio", auth, getPortfolio);
router.get("/trades", auth, getTradeHistory);
router.post("/portfolio/reset", auth, resetPortfolio);

module.exports = router;