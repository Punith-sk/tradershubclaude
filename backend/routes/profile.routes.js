const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getMyProfile, updateUsername } = require("../controllers/profile.controller");

router.get("/profile", auth, getMyProfile);
router.post("/profile/username", auth, updateUsername);

module.exports = router;