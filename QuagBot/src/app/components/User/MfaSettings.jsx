"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  authError,
  authInput,
  authNotice,
  button,
  buttonDanger,
  buttonPrimary,
  card,
  cardRow,
  cardRowInput,
  rowLabel,
  rowValue,
  rowValueConnect,
} from "../ui/styles";

// Two-factor authentication (authenticator app / TOTP) section of the profile page.
// States: loading -> off | on, and off -> enrolling (QR code + code input) -> on.
function MfaSettings() {
  const [factor, setFactor] = useState(null); // the verified TOTP factor, if any
  const [enrollment, setEnrollment] = useState(null); // { id, qrCode, secret } while setting up
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // data.totp holds verified factors only; data.all includes unfinished setups.
  function fetchFactor() {
    return createClient().auth.mfa.listFactors().then(({ data, error }) => {
      if (error) throw error;
      return data.totp[0] ?? null;
    });
  }

  function loadFactors() {
    fetchFactor()
      .then(setFactor)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchFactor()
      .then(setFactor)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function startSetup() {
    setError("");
    setNotice("");
    setBusy(true);
    const supabase = createClient();

    // A setup that was abandoned leaves an unverified factor behind, which would
    // block a new one with the same name. Clear those first.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) {
      if (f.factor_type === "totp" && f.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
      issuer: "QuagBot",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirmSetup(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId: enrollment.id,
      code: code.trim(),
    });
    setBusy(false);
    if (error) {
      setError("That code didn't work. Check the time on your phone and try the newest code.");
      return;
    }
    setEnrollment(null);
    setCode("");
    setNotice("Two-factor authentication is on. You'll enter a code each time you log in.");
    loadFactors();
  }

  async function cancelSetup() {
    if (enrollment) await createClient().auth.mfa.unenroll({ factorId: enrollment.id });
    setEnrollment(null);
    setCode("");
    setError("");
  }

  async function turnOff() {
    if (!window.confirm("Turn off two-factor authentication? Your account will only be protected by your password.")) {
      return;
    }
    setError("");
    setBusy(true);
    const { error } = await createClient().auth.mfa.unenroll({ factorId: factor.id });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNotice("Two-factor authentication is off.");
    loadFactors();
  }

  if (loading) return null;

  return (
    <div className="mt-space-5">
      <div className={card}>
        <div className={cardRow}>
          <span className={rowLabel}>Two-factor authentication</span>
          <span className={rowValueConnect}>
            {factor ? (
              <>
                <ShieldCheck size={16} /> On
              </>
            ) : (
              "Off"
            )}
          </span>
        </div>

        {enrollment && (
          <form onSubmit={confirmSetup}>
            <div className={`${cardRow} flex-col items-center`}>
              <span className={rowLabel}>
                Scan this with an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, 1Password…)
              </span>
              <img src={enrollment.qrCode} alt="QR code for your authenticator app" className="size-44 bg-white p-2" />
              <span className={rowLabel}>Can&apos;t scan it? Enter this key instead:</span>
              <code className={`${rowValue} break-all select-all`}>{enrollment.secret}</code>
            </div>
            <label className={cardRowInput}>
              <span className={rowLabel}>6-digit code</span>
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
            <div className={`${cardRow} justify-end`}>
              <button type="button" className={button} onClick={cancelSetup} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className={buttonPrimary} disabled={busy || code.length !== 6}>
                {busy ? "Checking…" : "Turn on"}
              </button>
            </div>
          </form>
        )}
      </div>

      {error && <p className={authError} role="alert">{error}</p>}
      {notice && <p className={authNotice}>{notice}</p>}

      {!enrollment && (
        <div className="mt-space-2 flex flex-col">
          {factor ? (
            <button type="button" className={buttonDanger} onClick={turnOff} disabled={busy}>
              Turn off two-factor authentication
            </button>
          ) : (
            <button type="button" className={button} onClick={startSetup} disabled={busy}>
              {busy ? "Starting…" : "Set up authenticator app"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MfaSettings;
