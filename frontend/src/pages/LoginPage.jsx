import { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onSwitch }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await api.login(form);
    if (res.token) { login(res.user, res.token); }
    else setError(res.message || "Login failed");
  }

  return (
    <div className="auth-page">
      <h2>Login to TradersHub</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error-msg">{error}</p>}
      <p>No account? <button onClick={onSwitch}>Register</button></p>
    </div>
  );
}
