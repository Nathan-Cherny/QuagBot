"use client";

import PageWrapper from "../components/Layout/PageWrapper";
import { pageTitle } from "../components/ui/styles";

function TeacherDash() {
  return (
    <PageWrapper basic>
      <h1 className={pageTitle}>Teacher Dashboard</h1>
    </PageWrapper>
  );
}

export default TeacherDash;
