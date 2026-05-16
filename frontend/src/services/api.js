const BASE_URL = "http://localhost:5000/api";
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
};
