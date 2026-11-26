"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogOutButton from "../components/Layout/Elements/LogOutButton";

import PageWrapper from "../components/Layout/PageWrapper";
import {
  buttonStack,
  card,
  cardRow,
  pageTitle,
  rowLabel,
  rowValue,
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

          <div className={cardRow}>
            <span className={rowLabel}>Classrooms</span>
            <Link href="/classrooms" className={`${rowValue} underline`}>Open classrooms</Link>
          </div>
        </div>

        <div className={buttonStack}>
          <LogOutButton handleLogout={handleLogout}/>

        </div>
    </PageWrapper>
  );
}

export default Profile;
