"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlugZap } from "lucide-react";
import LogOutButton from "../components/Layout/Elements/LogOutButton";

import PageWrapper from "../components/Layout/PageWrapper";
import {
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
import { setTeacherMode } from "@/lib/teacherMode";

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
        role: data.user.user_metadata?.account_type,
        teacherShareCode: data.user.user_metadata?.teacher_share_code,
        connectedTeacher: null, // TODO: load from the classrooms table
      });
    });
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    setTeacherMode(false);
    router.push("/login");
    router.refresh();
  }

  if (!user) {
    return <PageWrapper basic><p className="text-center">Loading…</p></PageWrapper>;
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

          {user.role === "teacher" && (
            <div className={cardRow}>
              <span className={rowLabel}>Teacher share code</span>
              <span className={rowValue}>{user.teacherShareCode ?? "Unavailable"}</span>
            </div>
          )}

          {user.role !== "teacher" && (
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
          )}
        </div>

        <div className={buttonStack}>
          <LogOutButton handleLogout={handleLogout}/>

        </div>
    </PageWrapper>
  );
}

export default Profile;
