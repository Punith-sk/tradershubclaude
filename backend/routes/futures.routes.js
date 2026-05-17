const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  openFuturesPosition,
  closeFuturesPosition,
  getFuturesPosition,
  getFuturesHistory,
} = require("../controllers/futures.controller");

router.post("/futures/open", auth, openFuturesPosition);
router.post("/futures/close", auth, closeFuturesPosition);
router.get("/futures/position", auth, getFuturesPosition);
router.get("/futures/history", auth, getFuturesHistory);

module.exports = router;