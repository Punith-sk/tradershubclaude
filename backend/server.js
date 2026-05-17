const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const tradeRoutes = require("./routes/trade.routes");
const futuresRoutes = require("./routes/futures.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", tradeRoutes);
app.use("/api", futuresRoutes);
const leaderboardRoutes = require("./routes/leaderboard.routes");
// and below the other app.use lines:
app.use("/api", leaderboardRoutes);

app.get("/", (req, res) => res.json({ status: "TradersHub API running" }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server running on port 5000")
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));