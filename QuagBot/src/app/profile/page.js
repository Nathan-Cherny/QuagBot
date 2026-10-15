"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, PlugZap } from "lucide-react";
import PageWrapper from "../components/Layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";

function Profile() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUser({
        name: data.user.user_metadata?.display_name ?? "Student",
        email: data.user.email,
        connectedTeacher: null, // TODO: load from the classrooms table
      });
    });
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!user) {
    return <PageWrapper className="basic-page"><p>Loading…</p></PageWrapper>;
  }

  return (
    <PageWrapper className="basic-page">
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
    </PageWrapper>
  );
}

export default Profile;
