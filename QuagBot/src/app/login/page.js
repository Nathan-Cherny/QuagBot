"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import PageWrapper from "../components/Layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";

function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh(); // re-run server code so it sees the new session cookie
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

        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="profile-actions">
          <button type="submit" className="profile-button auth-submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
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
