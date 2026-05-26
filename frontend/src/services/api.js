const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
function getToken() { return localStorage.getItem("token"); }
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: "Bearer " + getToken() };
}
export const api = {
  register: (data) => fetch(BASE_URL + "/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
  login: (data) => fetch(BASE_URL + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
  getPortfolio: () => fetch(BASE_URL + "/portfolio", { headers: authHeaders() }).then(r => r.json()),
  placeBuy: (quantity) => fetch(BASE_URL + "/trades/buy", { method: "POST", headers: authHeaders(), body: JSON.stringify({ quantity }) }).then(r => r.json()),
  placeSell: (quantity) => fetch(BASE_URL + "/trades/sell", { method: "POST", headers: authHeaders(), body: JSON.stringify({ quantity }) }).then(r => r.json()),
  getTradeHistory: () => fetch(BASE_URL + "/trades", { headers: authHeaders() }).then(r => r.json()),
  resetPortfolio: () => fetch(BASE_URL + "/portfolio/reset", { method: "POST", headers: authHeaders() }).then(r => r.json()),
  getFuturesPositions: () => fetch(BASE_URL + "/futures/positions", { headers: authHeaders() }).then(r => r.json()),
  getFuturesHistory: () => fetch(BASE_URL + "/futures/history", { headers: authHeaders() }).then(r => r.json()),
  openFuturesPosition: (direction, quantity, symbol) => fetch(BASE_URL + "/futures/open", { method: "POST", headers: authHeaders(), body: JSON.stringify({ direction, quantity, symbol }) }).then(r => r.json()),
  closeFuturesPosition: (positionId) => fetch(BASE_URL + "/futures/close", { method: "POST", headers: authHeaders(), body: JSON.stringify({ positionId }) }).then(r => r.json()),
  getLeaderboard: () => fetch(BASE_URL + "/leaderboard", { headers: authHeaders() }).then(r => r.json()),
  getExpiries: () => fetch(BASE_URL + "/options/expiries", { headers: authHeaders() }).then(r => r.json()),
  getOptionsChain: (expiry) => fetch(BASE_URL + "/options/chain?expiry=" + expiry, { headers: authHeaders() }).then(r => r.json()),
  buyOption: (data) => fetch(BASE_URL + "/options/buy", { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  closeOption: (optionId) => fetch(BASE_URL + "/options/close", { method: "POST", headers: authHeaders(), body: JSON.stringify({ optionId }) }).then(r => r.json()),
  getOpenOptions: () => fetch(BASE_URL + "/options/positions", { headers: authHeaders() }).then(r => r.json()),
  getOptionsHistory: () => fetch(BASE_URL + "/options/history", { headers: authHeaders() }).then(r => r.json()),
  closeAllOptions: () => fetch(BASE_URL + "/options/closeall", { method: "POST", headers: authHeaders() }).then(r => r.json()),
};