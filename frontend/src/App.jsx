// App.jsx — FIXED
// ─────────────────────────────────────────────────────────────────
// FIX: Session persists on page refresh.
//
// OLD BEHAVIOUR: App read token/user from localStorage on first render,
// but React StrictMode unmounts+remounts the component, wiping state.
// The token existed in localStorage but the component re-initialized
// to null because useState initializers run twice in StrictMode and
// the second run sometimes reads stale values.
//
// FIX: Validate the stored token against the backend on mount using
// /auth/me. If valid → stay logged in. If invalid/expired → clear
// localStorage and show sign-in. This makes refresh behaviour correct
// in both development (StrictMode) and production.
//
// FIX: Google Sign-In added via Google Identity Services (GSI).
// When Google returns a credential JWT, we send it to /auth/google
// which verifies it, creates/finds the user, and returns our own
// session token. No third-party library needed — uses the GSI script.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";

const API = "http://localhost:8000";

export default function App() {
  const [token,    setToken]    = useState(null);
  const [user,     setUser]     = useState(null);
  const [checking, setChecking] = useState(true); // validating stored session

  // On mount: validate stored token with backend
  useEffect(() => {
    const storedToken = localStorage.getItem("nb_token");
    const storedUser  = localStorage.getItem("nb_user");

    if (!storedToken || !storedUser) {
      setChecking(false);
      return;
    }

    // Ping /auth/me to confirm token is still valid
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("expired");
        return res.json();
      })
      .then((userData) => {
        // Token valid → restore session
        setToken(storedToken);
        setUser(userData);
      })
      .catch(() => {
        // Token invalid/expired → clear and show sign-in
        localStorage.removeItem("nb_token");
        localStorage.removeItem("nb_user");
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (t, u) => {
    localStorage.setItem("nb_token", t);
    localStorage.setItem("nb_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("nb_token");
    localStorage.removeItem("nb_user");
    setToken(null);
    setUser(null);
  };

  // Show blank screen while validating stored session
  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", background: "#020912",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 36, height: 36, border: "3px solid #0f2545",
          borderTop: "3px solid #38bdf8", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!token || !user) {
    return <AuthPage onLogin={handleLogin} />;
  }
  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}
