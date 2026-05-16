export function subscribeToBtcPrice(onPrice) {
  const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@bookTicker");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onPrice({ bid: parseFloat(data.b), ask: parseFloat(data.a), ltp: (parseFloat(data.b) + parseFloat(data.a)) / 2 });
  };
  ws.onclose = () => setTimeout(() => subscribeToBtcPrice(onPrice), 3000);
  return () => ws.close();
}
