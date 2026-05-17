const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getLeaderboard } = require("../controllers/leaderboard.controller");

router.get("/leaderboard", auth, getLeaderboard);

module.exports = router;