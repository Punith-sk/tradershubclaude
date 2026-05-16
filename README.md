# TradersHub - Bitcoin Paper Trading Platform

## Project Structure
```
tradershub/
  backend/
    server.js              ← Entry point - run this
    .env.example           ← Copy to .env and fill in
    models/
      User.model.js
      Portfolio.model.js   ← Cash, BTC holdings, P&L fields
      Trade.model.js       ← Every trade record
    controllers/
      auth.controller.js   ← Register / Login
      trade.controller.js  ← Buy / Sell / Portfolio / History
    services/
      tradeEngine.js       ← Core execution logic (heart of the app)
    utils/
      calculations.js      ← Pure P&L math functions
    middleware/
      auth.middleware.js   ← JWT protection
    routes/
      auth.routes.js
      trade.routes.js
  frontend/
    src/
      App.jsx
      main.jsx
      context/
        AuthContext.jsx    ← Login state
        PortfolioContext.jsx ← Portfolio state + refresh
      services/
        api.js             ← All backend API calls
        priceService.js    ← Binance WebSocket live price
      components/
        Dashboard.jsx      ← Main screen
        TradingPanel.jsx   ← Buy/Sell form
        TradeHistory.jsx   ← Trade table
        PnLSummary.jsx     ← P&L display
      pages/
        LoginPage.jsx
        RegisterPage.jsx
```

## Setup - Step by Step

### Backend (run first)
```bash
cd tradershub/backend
npm install
cp .env.example .env
# Edit .env → paste your MongoDB Atlas URI and a JWT secret
npm run dev
# Should print: MongoDB connected + Server running on port 5000
```

### Frontend (run in a second terminal)
```bash
cd tradershub/frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

## API Endpoints
| Method | URL | Auth | Body |
|--------|-----|------|------|
| POST | /api/auth/register | No | { name, email, password } |
| POST | /api/auth/login | No | { email, password } |
| GET | /api/portfolio | Yes | - |
| POST | /api/trades/buy | Yes | { quantity: 0.001 } |
| POST | /api/trades/sell | Yes | { quantity: 0.001 } |
| GET | /api/trades | Yes | - |

## How it works
1. Register → get $10,000 USDT virtual capital
2. Buy BTC → price fetched live from Binance at execution time
3. Sell BTC → P&L calculated against your average buy price
4. Dashboard updates live via Binance WebSocket
