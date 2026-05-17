import { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

export default function PriceChart() {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 300,
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
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
    });

    const dataPoints = [];

    const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      const point = {
        time: Math.floor(trade.T / 1000),
        value: parseFloat(trade.p),
      };
      if (dataPoints.length === 0 || dataPoints[dataPoints.length - 1].time !== point.time) {
        dataPoints.push(point);
        if (dataPoints.length > 500) dataPoints.shift();
        lineSeries.setData(dataPoints);
      }
    };

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      ws.close();
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem" }}>
      <h3 style={{ marginBottom: "0.75rem", color: "#f8fafc" }}>BTC/USDT Live Chart</h3>
      <div ref={chartRef} style={{ width: "100%" }} />
    </div>
  );
}