"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, PlugZap } from "lucide-react";
import { handleSubmit } from "./submission";
import PageWrapper from "../components/Layout/PageWrapper";
import {
  authError,
  authInput,
  authInputWrap,
  authLink,
  authNotice,
  authSwitch,
  buttonPrimary,
  buttonStack,
  card,
  cardRow,
  cardRowInput,
  iconButton,
  pageTitle,
  required,
  rowLabel,
  rowValueConnect,
} from "../components/ui/styles";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("Student");
  const [showPassword, setShowPassword] = useState(false);
  const [connectedTeacher] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  return (
    <PageWrapper basic>
      <h1 className={pageTitle}>Create your account</h1>

      <form
        className="flex flex-col"
        onSubmit={(event) =>
          handleSubmit(event, {
            name,
            email,
            password,
            accountType,
            setError,
            setNotice,
            setSubmitting,
            router,
          })
        }
      >
        <div className={card}>
          <label className={cardRowInput}>
            <span className={`${rowLabel} ${required}`}>Name</span>
            <input
              type="text"
              className={authInput}
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className={cardRowInput}>
            <span className={`${rowLabel} ${required}`}>Email</span>
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
            <label className={`${rowLabel} ${required}`} htmlFor="signup-password">
              Password
            </label>
            <span className={authInputWrap}>
              <input
                id="signup-password"
                minLength={8}
                type={showPassword ? "text" : "password"}
                className={authInput}
                placeholder="Create a password"
                autoComplete="new-password"
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

          <label className={cardRowInput}>
            <span className={`${rowLabel} ${required}`}>Account Type</span>
            <select
              className={`${authInput} text-right`}
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              aria-label="Account Type"
            >
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
          </label>

          {accountType === "Student" && (
            <div className={cardRow}>
              <span className={rowLabel}>Teacher to connect to</span>
              <span className={rowValueConnect}>
                {connectedTeacher ?? "Not connected"}
                {!connectedTeacher && (
                  <button
                    type="button"
                    className={iconButton}
                    title="Connect to your teacher"
                    aria-label={"Connect"}
                  >
                    <PlugZap size={16} />
                  </button>
                )}
              </span>
            </div>
          )}
        </div>

        {error && <p className={authError} role="alert">{error}</p>}
        {notice && <p className={authNotice}>{notice}</p>}

        <div className={buttonStack}>
          <button type="submit" className={buttonPrimary} disabled={submitting}>
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </div>
      </form>

      <p className={authSwitch}>
        Already have an account? <a href="/login" className={authLink}>Log in</a>
      </p>
    </PageWrapper>
  );
}

export default SignUp;
