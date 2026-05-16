import { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage({ onSwitch }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await api.register(form);
    if (res.token) { login(res.user, res.token); }
    else setError(res.message || "Registration failed");
  }

  return (
    <div className="auth-page">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        <button type="submit">Register — Get $10,000 USDT</button>
      </form>
      {error && <p className="error-msg">{error}</p>}
      <p>Have an account? <button onClick={onSwitch}>Login</button></p>
    </div>
  );
}
