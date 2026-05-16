const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const tradeRoutes = require("./routes/trade.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", tradeRoutes);
app.get("/", (req, res) => res.json({ status: "TradersHub API running" }));

// Replace +srv with standard connection to bypass DNS SRV lookup issue on Windows
const uri = process.env.MONGODB_URI.replace(
  "mongodb+srv://",
  "mongodb://"
).replace(
  "cluster0.4gvi1zj.mongodb.net/",
  "cluster0-shard-00-00.4gvi1zj.mongodb.net:27017,cluster0-shard-00-01.4gvi1zj.mongodb.net:27017,cluster0-shard-00-02.4gvi1zj.mongodb.net:27017/"
) + "&ssl=true&replicaSet=atlas-xxxxxxx&authSource=admin";

  mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server running on port 5000")
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));