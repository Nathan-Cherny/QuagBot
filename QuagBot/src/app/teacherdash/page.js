"use client";

import { useEffect, useRef } from "react";
import PageWrapper from "../components/Layout/PageWrapper";
import Sidebar from "../components/Layout/Sidebar";
import { authInput, button, pageTitle } from "../components/ui/styles";

function TeacherDash() {
  const classroomCodeDialog = useRef(null);
  const students = <p className="text-sm text-text-muted">No students yet.</p>;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("welcome") !== "signup") return;

    url.searchParams.delete("welcome");
    window.history.replaceState(window.history.state, "", url);
    if (classroomCodeDialog.current && !classroomCodeDialog.current.open) {
      classroomCodeDialog.current.showModal();
    }
  }, []);

  return (
    <PageWrapper>
      <Sidebar title="Students" side="left">
        {students}
      </Sidebar>
      <main className="flex-1 p-space-5">
        <h1 className={pageTitle}>Faculty Dashboard</h1>
      </main>
      <Sidebar title="Classrooms" side="right" />
      <dialog
        ref={classroomCodeDialog}
        aria-labelledby="classroom-code-title"
        aria-describedby="classroom-code-description"
        className="fixed inset-0 m-auto w-11/12 max-w-md rounded-card border border-border bg-surface p-space-5 text-text shadow-xl backdrop:bg-black/40"
      >
        <h2 id="classroom-code-title" className="mb-space-3 text-lg font-medium">
          Add a classroom
        </h2>
        <p id="classroom-code-description" className="mb-space-4 text-sm text-text-muted">
          Enter your classroom code to get started.
        </p>
        <label className="mb-space-2 block text-sm" htmlFor="classroom-code">
          Classroom code
        </label>
        <input
          id="classroom-code"
          type="text"
          className={authInput}
          placeholder="Classroom code"
          autoComplete="off"
        />
        <button
          type="button"
          className={`${button} mt-space-4 w-full`}
          onClick={() => classroomCodeDialog.current?.close()}
        >
          Close
        </button>
      </dialog>
    </PageWrapper>
  );
}

export default TeacherDash;
