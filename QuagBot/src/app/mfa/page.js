"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "../components/Layout/PageWrapper";
import {
  authError,
  authInput,
  authLink,
  authSwitch,
  buttonPrimary,
  buttonStack,
  card,
  cardRowInput,
  pageTitle,
  rowLabel,
} from "../components/ui/styles";
import { createClient } from "@/lib/supabase/client";

// Second login step for users with two-factor authentication turned on.
// proxy.js sends them here after their password until they enter a valid code.
function MfaChallenge() {
  const [factorId, setFactorId] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    createClient().auth.mfa.listFactors().then(({ data, error }) => {
      if (error) {
        setError("Couldn't load your two-factor settings. Refresh to try again.");
        return;
      }
      const totp = data.totp[0];
      if (!totp) {
        router.replace("/"); // no factor to verify
        return;
      }
      setFactorId(totp.id);
    });
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    setSubmitting(false);
    if (error) {
      setError("That code didn't work. Try the newest code from your authenticator app.");
      setCode("");
      return;
    }
    router.push("/");
    router.refresh(); // the session is now AAL2; let the server see it
  }

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <PageWrapper basic>
      <h1 className={pageTitle}>Enter your code</h1>

      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className={card}>
          <label className={cardRowInput}>
            <span className={rowLabel}>Code from your authenticator app</span>
            <input
              className={authInput}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
          </label>
        </div>

        {error && <p className={authError} role="alert">{error}</p>}

        <div className={buttonStack}>
          <button
            type="submit"
            className={buttonPrimary}
            disabled={!factorId || submitting || code.length !== 6}
          >
            {submitting ? "Checking…" : "Verify"}
          </button>
        </div>
      </form>

      <p className={authSwitch}>
        Not you?{" "}
        <button type="button" className={`${authLink} cursor-pointer`} onClick={handleLogout}>
          Log out
        </button>
      </p>
    </PageWrapper>
  );
}

export default MfaChallenge;
