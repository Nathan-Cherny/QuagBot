"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, PlugZap } from "lucide-react";
import PageWrapper from "../components/Layout/PageWrapper";
import {
  button,
  buttonDanger,
  buttonStack,
  card,
  cardRow,
  iconButton,
  pageTitle,
  rowLabel,
  rowValue,
  rowValueConnect,
} from "../components/ui/styles";
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
    return <PageWrapper basic><p>Loading…</p></PageWrapper>;
  }

  return (
    <PageWrapper basic>
        <h1 className={pageTitle}>Hello, {user.name}</h1>

        <div className={card}>
          <div className={cardRow}>
            <span className={rowLabel}>Name</span>
            <span className={rowValue}>{user.name}</span>
          </div>

          <div className={cardRow}>
            <span className={rowLabel}>Email</span>
            <span className={rowValue}>{user.email}</span>
          </div>

          <div className={cardRow}>
            <span className={rowLabel}>Connected teacher</span>
            <span className={rowValueConnect}>
              {user.connectedTeacher ?? "Not connected"}
              {!user.connectedTeacher && (
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
        </div>

        <div className={buttonStack}>
          <button
            type="button"
            className={button}
            onClick={() => console.log("test")}
          >
            Placeholder 1
          </button>

          <button
            type="button"
            className={button}
            onClick={() => console.log("test")}
          >
            Placeholder 2
          </button>

          <button
            type="button"
            className={button}
            onClick={() => console.log("test")}
          >
            Place holder 3
          </button>

          <button
            type="button"
            className={buttonDanger}
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
