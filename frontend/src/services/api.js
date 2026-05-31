const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: "Bearer " + token } : {}),
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Request failed");
  }
  return res.json();
}

export const api = {
  register: (data) =>
    fetch(BASE_URL + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  login: (data) =>
    fetch(BASE_URL + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  getPortfolio: () =>
    fetch(BASE_URL + "/portfolio", { headers: authHeaders() }).then(handleResponse),

  placeBuy: (quantity) =>
    fetch(BASE_URL + "/trades/buy", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ quantity }),
    }).then(handleResponse),

  placeSell: (quantity) =>
    fetch(BASE_URL + "/trades/sell", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ quantity }),
    }).then(handleResponse),

  getTradeHistory: () =>
    fetch(BASE_URL + "/trades", { headers: authHeaders() }).then(handleResponse),

  resetPortfolio: () =>
    fetch(BASE_URL + "/portfolio/reset", {
      method: "POST",
      headers: authHeaders(),
    }).then(handleResponse),

  getFuturesPositions: () =>
    fetch(BASE_URL + "/futures/positions", { headers: authHeaders() }).then(handleResponse),

  getFuturesHistory: () =>
    fetch(BASE_URL + "/futures/history", { headers: authHeaders() }).then(handleResponse),

  openFuturesPosition: (direction, quantity, symbol) =>
    fetch(BASE_URL + "/futures/open", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ direction, quantity, symbol }),
    }).then(handleResponse),

  closeFuturesPosition: (positionId) =>
    fetch(BASE_URL + "/futures/close", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ positionId }),
    }).then(handleResponse),

  getLeaderboard: () =>
    fetch(BASE_URL + "/leaderboard", { headers: authHeaders() }).then(handleResponse),

  getExpiries: () =>
    fetch(BASE_URL + "/options/expiries", { headers: authHeaders() }).then(handleResponse),

  getOptionsChain: (expiry) =>
    fetch(BASE_URL + "/options/chain?expiry=" + expiry, { headers: authHeaders() }).then(handleResponse),

  buyOption: (data) =>
    fetch(BASE_URL + "/options/buy", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  closeOption: (optionId) =>
    fetch(BASE_URL + "/options/close", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ optionId }),
    }).then(handleResponse),

  getOpenOptions: () =>
    fetch(BASE_URL + "/options/positions", { headers: authHeaders() }).then(handleResponse),

  getOptionsHistory: () =>
    fetch(BASE_URL + "/options/history", { headers: authHeaders() }).then(handleResponse),

  closeAllOptions: () =>
    fetch(BASE_URL + "/options/closeall", {
      method: "POST",
      headers: authHeaders(),
    }).then(handleResponse),

  getWeeklyLeaderboard: () =>
    fetch(BASE_URL + "/competition/weekly", { headers: authHeaders() }).then(handleResponse),

  getHallOfFame: () =>
    fetch(BASE_URL + "/competition/halloffame", { headers: authHeaders() }).then(handleResponse),

  getProfile: () =>
    fetch(BASE_URL + "/profile", { headers: authHeaders() }).then(handleResponse),

  updateUsername: (username) =>
    fetch(BASE_URL + "/profile/username", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ username }),
    }).then(handleResponse),
};