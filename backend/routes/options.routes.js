const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  fetchExpiries,
  fetchChain,
  buyOption,
  closeOption,
  getOpenOptions,
  getOptionsHistory,
  closeAllOptions,
} = require("../controllers/options.controller");

router.get("/options/expiries", auth, fetchExpiries);
router.get("/options/chain", auth, fetchChain);
router.post("/options/buy", auth, buyOption);
router.post("/options/close", auth, closeOption);
router.post("/options/closeall", auth, closeAllOptions);
router.get("/options/positions", auth, getOpenOptions);
router.get("/options/history", auth, getOptionsHistory);

module.exports = router;