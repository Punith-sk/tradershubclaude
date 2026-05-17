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

async function fetchCandles(interval) {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=200`
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
  const [currentPrice, setCurrentPrice] = useState(null);

  useEffect(() => {
    // Create chart once
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

    // Close existing WebSocket
    if (wsRef.current) wsRef.current.close();

    // Fetch historical candles
    fetchCandles(activeInterval).then((candles) => {
      seriesRef.current.setData(candles);
      chartInstance.current.timeScale().fitContent();

      // Open WebSocket for live updates
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/btcusdt@kline_${activeInterval}`
      );

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const k = msg.k;
        setCurrentPrice(parseFloat(k.c));
        seriesRef.current.update({
          time: Math.floor(k.t / 1000),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        });
      };

      wsRef.current = ws;
    });

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeInterval]);

  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div>
          <span style={{ color: "#f8fafc", fontWeight: 600 }}>BTC/USDT</span>
          {currentPrice && (
            <span style={{ color: "#f59e0b", marginLeft: "1rem", fontSize: "1.1rem", fontWeight: "bold" }}>
              ${currentPrice.toLocaleString()}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.interval}
              onClick={() => setActiveInterval(tf.interval)}
              style={{
                background: activeInterval === tf.interval ? "#f59e0b" : "#0f172a",
                color: activeInterval === tf.interval ? "#0f172a" : "#94a3b8",
                border: "1px solid #334155",
                padding: "0.25rem 0.6rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
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