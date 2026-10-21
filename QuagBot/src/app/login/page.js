"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import PageWrapper from "../components/Layout/PageWrapper";
import {
  authError,
  authInput,
  authInputWrap,
  authLink,
  authSwitch,
  buttonPrimary,
  buttonStack,
  card,
  cardRowInput,
  iconButton,
  pageTitle,
  rowLabel,
} from "../components/ui/styles";
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
    <PageWrapper basic>
      <h1 className={pageTitle}>Welcome back</h1>

      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className={card}>
          <label className={cardRowInput}>
            <span className={rowLabel}>Email</span>
            <input
              type="email"
              className={authInput}
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <div className={cardRowInput}>
            <label className={rowLabel} htmlFor="login-password">
              Password
            </label>
            <span className={authInputWrap}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={authInput}
                placeholder="Your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={iconButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </div>
        </div>

        {error && <p className={authError} role="alert">{error}</p>}

        <div className={buttonStack}>
          <button type="submit" className={buttonPrimary} disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </div>
      </form>

      <p className={authSwitch}>
        New to QuagBot? <a href="/signup" className={authLink}>Sign up</a>
      </p>
    </PageWrapper>
  );
}

export default LogIn;
