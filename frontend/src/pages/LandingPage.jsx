import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: "10x", label: "Leverage" },
  { value: "6+", label: "Crypto Pairs" },
  { value: "₹0", label: "Risk" },
  { value: "100%", label: "Free" },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Futures Trading",
    desc: "Go LONG or SHORT on BTC, ETH, SOL and more with 10x leverage. Real liquidation prices, live P&L.",
  },
  {
    icon: "📊",
    title: "Options Chain",
    desc: "Real Deribit options data. Buy calls and puts with live Greeks — Delta, Theta, IV displayed in real time.",
  },
  {
    icon: "📈",
    title: "Live Charts",
    desc: "TradingView-powered candlestick charts with 1m to 1D timeframes. Switch between 6 crypto pairs instantly.",
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    desc: "Compete with other traders. Win rate, realized P&L, return % — all ranked in real time.",
  },
  {
    icon: "📋",
    title: "Trade History",
    desc: "Full audit trail — open time, close time, hold duration, P&L per trade across Futures, Spot and Options.",
  },
  {
    icon: "🔒",
    title: "Zero Risk",
    desc: "Start with $10,000 virtual capital. Make mistakes, learn strategies, build confidence — all for free.",
  },
];

const TICKER_ITEMS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT",
  "Futures", "Options", "10x Leverage", "Live Greeks", "Leaderboard", "Zero Risk",
];

export default function LandingPage({ onGetStarted }) {
  const [prices, setPrices] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => {
    // Fetch live prices for ticker
    async function fetchPrices() {
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
      const p = {};
      for (const sym of symbols) {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`);
          const data = await res.json();
          p[sym] = {
            price: parseFloat(data.lastPrice).toLocaleString(),
            change: parseFloat(data.priceChangePercent).toFixed(2),
          };
        } catch {}
      }
      setPrices(p);
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  // Animated canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    let animFrame;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,158,11,${p.opacity})`;
        ctx.fill();
      });
      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(245,158,11,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animFrame = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div style={{ background: "#050d1a", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ticker-wrap { overflow: hidden; background: rgba(245,158,11,0.08); border-top: 1px solid rgba(245,158,11,0.2); border-bottom: 1px solid rgba(245,158,11,0.2); padding: 0.5rem 0; }
        .ticker-track { display: flex; gap: 3rem; white-space: nowrap; animation: ticker 30s linear infinite; }
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .ticker-item { font-size: 0.8rem; color: #f59e0b; font-weight: 500; letter-spacing: 0.05em; }
        .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(245,158,11,0.15); border-radius: 16px; padding: 2rem; text-align: center; transition: all 0.3s; }
        .stat-card:hover { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.4); transform: translateY(-4px); }
        .feature-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.75rem; transition: all 0.3s; cursor: default; }
        .feature-card:hover { background: rgba(245,158,11,0.04); border-color: rgba(245,158,11,0.25); transform: translateY(-4px); }
        .price-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.6rem 1rem; display: flex; align-items: center; gap: 0.75rem; }
        .glow-btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: #0f0f0f; border: none; padding: 1rem 2.5rem; border-radius: 50px; font-size: 1.1rem; font-weight: 700; cursor: pointer; font-family: 'Syne', sans-serif; transition: all 0.3s; box-shadow: 0 0 30px rgba(245,158,11,0.3); letter-spacing: 0.03em; }
        .glow-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px rgba(245,158,11,0.5); }
        .outline-btn { background: transparent; color: #f59e0b; border: 1px solid rgba(245,158,11,0.4); padding: 1rem 2.5rem; border-radius: 50px; font-size: 1.1rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.3s; }
        .outline-btn:hover { background: rgba(245,158,11,0.08); border-color: #f59e0b; }
        .nav-link { color: #94a3b8; font-size: 0.9rem; cursor: pointer; transition: color 0.2s; text-decoration: none; }
        .nav-link:hover { color: #f59e0b; }
        .badge { display: inline-block; background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); border-radius: 50px; padding: 0.35rem 1rem; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1.5rem; }
        .section { padding: 6rem 2rem; max-width: 1200px; margin: 0 auto; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr 1fr; }
          .hero-btns { flex-direction: column; align-items: center; }
          .hero-title { font-size: 2.8rem !important; }
        }
        @media (max-width: 480px) {
          .grid-3, .grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Canvas background */}
      <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 0, opacity: 0.6 }} />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(5,13,26,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#f59e0b" }}>
          TradersHub
        </div>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href="#how">How it works</a>
          <button className="glow-btn" style={{ padding: "0.5rem 1.5rem", fontSize: "0.9rem" }} onClick={onGetStarted}>
            Start Trading Free
          </button>
        </div>
      </nav>

      {/* LIVE TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">◆ {item}</span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: "relative", zIndex: 1, padding: "7rem 2rem 5rem", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <div className="badge">🚀 Paper Trading Platform</div>
        <h1 className="hero-title" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "4rem", lineHeight: 1.1, marginBottom: "1.5rem", background: "linear-gradient(135deg, #ffffff 0%, #f59e0b 60%, #d97706 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Making money is everyone's basic right and crypto gives us that opportunity.
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#94a3b8", marginBottom: "2.5rem", lineHeight: 1.7, maxWidth: "600px", margin: "0 auto 2.5rem" }}>
          Practice crypto futures and options trading with $10,000 virtual capital. Zero risk. Real market data. Real skills.
        </p>
        <div className="hero-btns" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="glow-btn" onClick={onGetStarted}>
            Start Trading Free →
          </button>
          <button className="outline-btn" onClick={onGetStarted}>
            View Leaderboard
          </button>
        </div>

        {/* Live price chips */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "3rem" }}>
          {Object.entries(prices).map(([sym, data]) => (
            <div key={sym} className="price-chip">
              <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{sym.replace("USDT", "")}</span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>${data.price}</span>
              <span style={{ fontSize: "0.8rem", color: parseFloat(data.change) >= 0 ? "#22c55e" : "#ef4444" }}>
                {parseFloat(data.change) >= 0 ? "+" : ""}{data.change}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ position: "relative", zIndex: 1, padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div className="grid-4">
          {STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#f59e0b", marginBottom: "0.5rem" }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="section" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div className="badge">Features</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem" }}>
            Everything a real trader needs
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: "500px", margin: "0 auto" }}>
            Built with real market data from Binance and Deribit. No fake prices, no fake Greeks.
          </p>
        </div>
        <div className="grid-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.6rem", color: "#f8fafc" }}>{f.title}</h3>
              <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ position: "relative", zIndex: 1, background: "rgba(245,158,11,0.03)", borderTop: "1px solid rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.1)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="badge">How it works</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.5rem", fontWeight: 800 }}>
              Start trading in 60 seconds
            </h2>
          </div>
          <div className="grid-3">
            {[
              { step: "01", title: "Create Account", desc: "Sign up free. No KYC, no credit card, no verification needed." },
              { step: "02", title: "Get $10,000 USDT", desc: "Your account is instantly credited with $10,000 virtual capital." },
              { step: "03", title: "Trade & Learn", desc: "Open futures positions, buy options, track P&L on the leaderboard." },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: "center", padding: "1.5rem" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "3.5rem", fontWeight: 800, color: "rgba(245,158,11,0.2)", marginBottom: "1rem", lineHeight: 1 }}>{s.step}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.6rem" }}>{s.title}</h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: "relative", zIndex: 1, padding: "6rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "3rem", fontWeight: 800, marginBottom: "1rem", background: "linear-gradient(135deg, #ffffff, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Ready to start trading?
        </h2>
        <p style={{ color: "#64748b", marginBottom: "2rem", fontSize: "1rem" }}>
          Join traders already practicing on TradersHub. Free forever.
        </p>
        <button className="glow-btn" onClick={onGetStarted} style={{ fontSize: "1.2rem", padding: "1.1rem 3rem" }}>
          Create Free Account →
        </button>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center", color: "#334155", fontSize: "0.85rem", position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", color: "#f59e0b", fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>TradersHub</div>
        <p>Crypto derivatives paper trading platform. For educational purposes only.</p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>Price data from Binance & Deribit. Not financial advice.</p>
      </footer>
    </div>
  );
}