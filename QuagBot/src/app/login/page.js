"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import PageWrapper from "../components/Layout/PageWrapper";

function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    // Swap this for your real log in logic (verify credentials, start session, redirect, etc.)
    console.log("Log in submitted", { email });
  }

  return (
    <PageWrapper className="basic-page">
      <h1 className="page-title">Welcome back</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="profile-card">
          <label className="profile-field auth-field">
            <span className="profile-field-label">Email</span>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <div className="profile-field auth-field">
            <label className="profile-field-label" htmlFor="login-password">
              Password
            </label>
            <span className="auth-input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="profile-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </div>
        </div>

        <div className="profile-actions">
          <button type="submit" className="profile-button auth-submit">
            Log in
          </button>
        </div>
      </form>

      <p className="auth-switch">
        New to QuagBot? <a href="/signup">Sign up</a>
      </p>
    </PageWrapper>
  );
}

export default LogIn;
