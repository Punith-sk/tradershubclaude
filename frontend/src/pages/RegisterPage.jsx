import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage({ onSwitch }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", referralCode: "" });
  const [error, setError] = useState("");
  const [bonus, setBonus] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Check URL for referral code e.g. ?ref=PUNITH-X7K2
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setForm(f => ({ ...f, referralCode: ref }));
      setBonus(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await api.register(form);
    if (res.token) {
      login(res.user, res.token);
      if (res.referralBonus > 0) {
        alert(`🎉 Referral bonus applied! You start with $15,000 instead of $10,000!`);
      }
    } else setError(res.message || "Registration failed");
  }

  return (
    <div className="auth-page">
      <h2>Create Account</h2>
      {bonus && (
        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", color: "#22c55e", fontSize: "0.85rem", textAlign: "center" }}>
          🎉 Referral code applied! You'll start with <strong>$15,000</strong> instead of $10,000!
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        <input placeholder="Referral Code (optional)" value={form.referralCode} onChange={e => setForm({...form, referralCode: e.target.value})} />
        <button type="submit">Register — Get ${form.referralCode ? "15,000" : "10,000"} USDT</button>
      </form>
      {error && <p className="error-msg">{error}</p>}
      <p>Have an account? <button onClick={onSwitch}>Login</button></p>
    </div>
  );
}