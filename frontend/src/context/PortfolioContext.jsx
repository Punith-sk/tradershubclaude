import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../services/api";
const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPortfolio();
      if (res.status === "success") setPortfolio(res.data);
    } catch (err) {
      console.error("Portfolio refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PortfolioContext.Provider value={{ portfolio, loading, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);
