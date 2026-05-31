const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const Portfolio = require("../models/Portfolio.model");
const { initPortfolio } = require("../services/tradeEngine");

function generateReferralCode(name) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}-${random}`;
}

async function register(req, res) {
  try {
    const { name, email, password, referralCode } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    // Generate unique referral code for new user
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = generateReferralCode(name);
      const existing = await User.findOne({ referralCode: newReferralCode });
      if (!existing) isUnique = true;
    }

    const user = new User({
      name,
      email,
      password,
      referralCode: newReferralCode,
      referredBy: referralCode || null,
    });
    await user.save();

    // Starting capital — base $10,000
    let startingCapital = 10000;

    // If referred by someone — both get $5,000 bonus
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        startingCapital = 15000; // new user gets $15,000

        // Give referrer $5,000 bonus
        await Portfolio.findOneAndUpdate(
          { userId: referrer._id },
          {
            $inc: {
              cashBalance: 5000,
              totalCapital: 5000,
            }
          }
        );

        // Update referrer's count
        await User.findByIdAndUpdate(referrer._id, {
          $inc: { referralCount: 1 }
        });
      }
    }

    await initPortfolio(user._id, startingCapital);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
      referralBonus: referralCode ? 5000 : 0,
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { register, login };