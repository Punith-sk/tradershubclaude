import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

const TIMEFRAMES = [
  { label: "1m", interval: "1m" },
  { label: "5m", interval: "5m" },
  { label: "15m", interval: "15m" },
  { label: "1H", interval: "1h" },
  { label: "4H", interval: "4h" },
  { label: "1D", interval: "1d" },
];

const COINS = [
  { label: "BTC", value: "BTCUSDT" },
  { label: "ETH", value: "ETHUSDT" },
  { label: "SOL", value: "SOLUSDT" },
  { label: "BNB", value: "BNBUSDT" },
  { label: "XRP", value: "XRPUSDT" },
  { label: "ADA", value: "ADAUSDT" },
];

async function fetchCandles(symbol, interval) {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`
  );
  const data = await res.json();
  return data.map((k) => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }));
}

export default function PriceChart() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);
  const [activeInterval, setActiveInterval] = useState("1m");
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [currentPrice, setCurrentPrice] = useState(null);

  useEffect(() => {
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 350,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#334155",
      },
      rightPriceScale: { borderColor: "#334155" },
    });

    chartInstance.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    seriesRef.current = series;

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    if (wsRef.current) wsRef.current.close();

    fetchCandles(activeSymbol, activeInterval).then((candles) => {
      seriesRef.current.setData(candles);
      chartInstance.current.timeScale().fitContent();

      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${activeSymbol.toLowerCase()}@kline_${activeInterval}`
      );

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const k = msg.k;
        const point = {
          time: Math.floor(k.t / 1000),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        };
        setCurrentPrice(parseFloat(k.c));
        try {
          seriesRef.current.update(point);
        } catch {
          // duplicate timestamp — rebuild data
          fetchCandles(activeSymbol, activeInterval).then(candles => {
            seriesRef.current.setData(candles);
          });
        }
      };

      wsRef.current = ws;
    });

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeInterval, activeSymbol]);

  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        {/* Coin selector */}
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
          {COINS.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveSymbol(c.value)}
              style={{
                background: activeSymbol === c.value ? "#f59e0b" : "#0f172a",
                color: activeSymbol === c.value ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: activeSymbol === c.value ? "bold" : "normal",
              }}
            >
              {c.label}
            </button>
          ))}
          {currentPrice && (
            <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: "1rem", marginLeft: "0.5rem", alignSelf: "center" }}>
              {activeSymbol.replace("USDT", "")}/USDT: ${currentPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Timeframe selector */}
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.interval}
              onClick={() => setActiveInterval(tf.interval)}
              style={{
                background: activeInterval === tf.interval ? "#f59e0b" : "#0f172a",
                color: activeInterval === tf.interval ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: activeInterval === tf.interval ? "bold" : "normal",
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={chartRef} style={{ width: "100%" }} />
    </div>
  );
}