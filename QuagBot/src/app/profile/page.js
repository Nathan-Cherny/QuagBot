"use client";

import { useState } from "react";
import { Eye, EyeOff, LogOut, PlugZap, User } from "lucide-react";
import PageWrapper from "../components/Layout/PageWrapper";

// Placeholder user data — replace with your real auth/user state.
const MOCK_USER = {
  name: "Killua Zoldyck",
  email: "kzoldyck@example.com",
  password: "Gonismyboyfriend123!",
  connectedTeacher: null,
};

function Profile() {
  const [user, setUser] = useState(MOCK_USER);
  const [showPassword, setShowPassword] = useState(false);

  function handleLogout() {
    // Swap this for your real logout logic (clear auth token, redirect, etc.)
    console.log("Logout clicked");
  }

  function handlePlaceholder(label) {
    console.log(`${label} clicked`);
  }

  return (
    <PageWrapper>
      <div className="page">
        <h1 className="page-title">Hello, {user.name}</h1>

        <div className="profile-card">
          <div className="profile-field">
            <span className="profile-field-label">Name</span>
            <span className="profile-field-value">{user.name}</span>
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Email</span>
            <span className="profile-field-value">{user.email}</span>
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Password</span>
            <span className="profile-field-value profile-field-value--password">
              {showPassword ? user.password : "••••••••••"}
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

          <div className="profile-field">
            <span className="profile-field-label">Connected teacher</span>
            <span className="profile-field-value profile-field-value--connect">
              {user.connectedTeacher ?? "Not connected"}
              {!user.connectedTeacher && (
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

        <div className="profile-actions">
          <button
            type="button"
            className="profile-button"
            onClick={() => console.log("test")}
          >
            Placeholder 1
          </button>

          <button
            type="button"
            className="profile-button"
            onClick={() => console.log("test")}
          >
            Placeholder 2
          </button>

          <button
            type="button"
            className="profile-button"
            onClick={() => console.log("test")}
          >
            Place holder 3
          </button>

          <button
            type="button"
            className="profile-button profile-button--danger"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Profile;
