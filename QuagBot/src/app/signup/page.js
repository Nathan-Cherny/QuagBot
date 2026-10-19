"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, PlugZap } from "lucide-react";
import PageWrapper from "../components/Layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connectedTeacher] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Stored on the user; the database trigger copies it into profiles.
      options: { data: { display_name: name } },
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    // With "Confirm email" on, Supabase creates the user but no session yet.
    if (!data.session) {
      setNotice("Check your email to confirm your account, then log in.");
      return;
    }
    // TODO: connecting to a teacher needs the classrooms join-code flow; do it after login.
    router.push("/");
    router.refresh();
  }

  return (
    <PageWrapper className="basic-page">
      <h1 className="page-title">Create your account</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="profile-card">
          <label className="profile-field auth-field">
            <span className="profile-field-label required">Name</span>
            <input
              type="text"
              className="auth-input"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="profile-field auth-field">
            <span className="profile-field-label required">Email</span>
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
            <label className="profile-field-label required" htmlFor="signup-password">
              Password
            </label>
            <span className="auth-input-wrap">
              <input
                id="signup-password"
                minLength={8}
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Create a password"
                autoComplete="new-password"
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

          {/* Same "Connected teacher" row as the profile page */}
          <div className="profile-field">
            <span className="profile-field-label">Teacher to connect to</span>
            <span className="profile-field-value profile-field-value--connect">
              {connectedTeacher ?? "Not connected"}
              {!connectedTeacher && (
                <button
                  type="button"
                  className="profile-password-toggle"
                  title="Connect to your teacher"
                  aria-label={"Connect"}
                >
                  <PlugZap size={16} />
                </button>
              )}
            </span>
          </div>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}

        <div className="profile-actions">
          <button type="submit" className="profile-button auth-submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </div>
      </form>

      <p className="auth-switch">
        Already have an account? <a href="/login">Log in</a>
      </p>
    </PageWrapper>
  );
}

export default SignUp;
