const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  openFuturesPosition,
  closeFuturesPosition,
  getFuturesPositions,
  getFuturesHistory,
  getSupportedSymbols,
} = require("../controllers/futures.controller");

router.post("/futures/open", auth, openFuturesPosition);
router.post("/futures/close", auth, closeFuturesPosition);
router.get("/futures/positions", auth, getFuturesPositions);
router.get("/futures/history", auth, getFuturesHistory);
router.get("/futures/symbols", auth, getSupportedSymbols);

module.exports = router;