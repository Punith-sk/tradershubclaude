const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getWeeklyLeaderboard, getHallOfFame } = require("../controllers/competition.controller");

router.get("/competition/weekly", auth, getWeeklyLeaderboard);
router.get("/competition/halloffame", auth, getHallOfFame);

module.exports = router;