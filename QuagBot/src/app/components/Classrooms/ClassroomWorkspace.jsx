'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageWrapper from '../Layout/PageWrapper';
import { authInput, buttonPrimary, pageTitle } from '../ui/styles';
import { createClassroom, joinClassroom, listClassrooms, loadClassroom, publishActivity, recordActivity } from '@/lib/classrooms';

const CARD = 'rounded-card border border-border bg-surface p-space-4';
const INPUT = `${authInput} w-full`;

function PublishActivity({ classroomId, onPublish }) {
  const [sources, setSources] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/education-sources', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Could not load the shared education library.');
        setSources(await response.json());
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const source = sources.find(({ id }) => id === fields.get('source'));
    const title = fields.get('title').trim();
    const prompt = fields.get('prompt').trim();
    if (!source || !title || !prompt || saving) return;
    setSaving(true);
    setError('');
    try {
      onPublish(await publishActivity(classroomId, { title, prompt, source }));
      form.reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${CARD} space-y-3`}>
      <h2 className="font-semibold">Publish a reading activity</h2>
      <label className="block text-sm">Title
        <input name="title" maxLength={120} required className={INPUT} />
      </label>
      <label className="block text-sm">Reading source
        <select name="source" required disabled={!sources?.length} className={INPUT} defaultValue="">
          <option value="" disabled>{sources ? 'Choose a source' : error ? 'Library unavailable' : 'Loading sources…'}</option>
          {sources?.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
        </select>
      </label>
      {sources?.length === 0 && <p className="text-sm text-text-muted">The education library has no sources yet.</p>}
      <label className="block text-sm">Prompt
        <textarea name="prompt" rows={3} maxLength={4000} required className={INPUT} />
      </label>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={saving || !sources?.length} className={buttonPrimary}>
        {saving ? 'Publishing…' : 'Publish activity'}
      </button>
    </form>
  );
}

function StudentActivity({ activity, progress, onProgress }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const answer = new FormData(event.currentTarget).get('response').trim();
    if (!answer || saving) return;
    setSaving(true);
    setError('');
    try {
      onProgress(await recordActivity(activity.id, answer));
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="text-sm text-text-muted">{progress?.submitted_at ? 'Submitted' : progress ? 'Started' : 'Not started'}</p>
      <Link href={`/activity-chat/${activity.id}`} className="inline-block text-sm font-medium underline">
        Open activity in QuagBot
      </Link>
      <form onSubmit={submit} className="space-y-2">
        <label className="block text-sm">Your response
          <textarea name="response" defaultValue={progress?.response ?? ''} rows={3} maxLength={4000} required className={INPUT} />
        </label>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving ? 'Submitting…' : progress?.submitted_at ? 'Update response' : 'Submit response'}
        </button>
      </form>
    </>
  );
}

function ClassroomDetails({ classroom, teacher }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    loadClassroom(classroom.id, teacher)
      .then((value) => { if (active) setData(value); })
      .catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [classroom.id, teacher]);

  function recordProgress(progress) {
    setData((current) => ({
      ...current,
      progress: [...current.progress.filter((row) => row.activity_id !== progress.activity_id), progress],
    }));
  }

  return (
    <section className="min-w-0 space-y-4">
      <div>
        <h2 className="text-xl font-semibold break-words">{classroom.name}</h2>
        {teacher && <p className="mt-1 text-sm">Join code <code className="rounded bg-navbar-bg px-2 py-1 font-semibold">{classroom.join_code}</code></p>}
      </div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {!data && !error && <p role="status">Loading classroom…</p>}
      {data && (
        <>
          {teacher && (
            <>
              <section className={CARD}>
                <h3 className="font-semibold">Roster <span className="text-sm text-text-muted">({data.roster.length})</span></h3>
                {data.roster.length ? (
                  <ul className="mt-2 list-inside list-disc text-sm">
                    {data.roster.map((student) => <li key={student.student_id}>{student.display_name}</li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-text-muted">Share the join code with students to build your roster.</p>}
              </section>
              <PublishActivity classroomId={classroom.id} onPublish={(activity) => {
                setData((current) => ({ ...current, activities: [activity, ...current.activities] }));
              }} />
            </>
          )}
          <h3 className="font-semibold">Reading activities</h3>
          {!data.activities.length && <p className="text-sm text-text-muted">No reading activities have been published.</p>}
          {data.activities.map((activity) => {
            const progress = data.progress.filter(({ activity_id }) => activity_id === activity.id);
            const byStudent = new Map(progress.map((row) => [row.student_id, row]));
            return (
              <article key={activity.id} className={`${CARD} space-y-2`}>
                <h4 className="font-semibold break-words">{activity.title}</h4>
                <p className="text-sm text-text-muted break-words">{activity.source_title}</p>
                <p className="whitespace-pre-wrap break-words">{activity.prompt}</p>
                {teacher ? (
                  <details className="mt-3">
                    <summary className="w-fit cursor-pointer text-sm font-medium">
                      {progress.filter(({ submitted_at }) => submitted_at).length} of {data.roster.length} submitted
                    </summary>
                    <ul className="mt-2 divide-y divide-border text-sm">
                      {data.roster.map((student) => {
                        const entry = byStudent.get(student.student_id);
                        return (
                          <li key={student.student_id} className="py-2">
                            <p>{student.display_name} · {entry?.submitted_at ? 'Submitted' : entry ? 'Started' : 'Not started'}</p>
                            {entry?.response && <p className="whitespace-pre-wrap break-words text-text-muted">{entry.response}</p>}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ) : <StudentActivity activity={activity} progress={progress[0]} onProgress={recordProgress} />}
              </article>
            );
          })}
        </>
      )}
    </section>
  );
}

export default function ClassroomWorkspace({ teacher = false, userId }) {
  const [classrooms, setClassrooms] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const classroom = classrooms?.find(({ id }) => id === selected) ?? classrooms?.[0];

  useEffect(() => {
    let active = true;
    listClassrooms(teacher, userId)
      .then((items) => { if (active) setClassrooms(items); })
      .catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [teacher, userId]);

  async function submitClass(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = new FormData(form).get('classroom').trim();
    if (!value || saving) return;
    setSaving(true);
    setError('');
    try {
      if (teacher) {
        const created = await createClassroom(value, userId);
        setClassrooms((items) => [created, ...(items ?? [])]);
        setSelected(created.id);
      } else {
        const id = await joinClassroom(value);
        setClassrooms(await listClassrooms(false, userId));
        setSelected(id);
      }
      form.reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageWrapper className="overflow-y-auto">
      <main className="mx-auto w-full max-w-6xl p-space-5">
        <h1 className={pageTitle}>{teacher ? 'Faculty Dashboard' : 'My classrooms'}</h1>
        <div className="mt-space-4 grid items-start gap-space-4 md:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-3">
            <form onSubmit={submitClass} className={`${CARD} space-y-2`}>
              <label className="block text-sm">{teacher ? 'Classroom name' : 'Classroom join code'}
                <input name="classroom" maxLength={teacher ? 100 : 32} required autoComplete="off" className={INPUT} />
              </label>
              <button type="submit" disabled={saving || !classrooms} className={buttonPrimary}>
                {saving ? 'Saving…' : teacher ? 'Create classroom' : 'Join classroom'}
              </button>
            </form>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            {!classrooms && !error && <p role="status">Loading classrooms…</p>}
            {classrooms?.length > 0 && (
              <nav aria-label="Classrooms" className="space-y-2">
                {classrooms.map((item) => (
                  <button key={item.id} type="button" aria-pressed={classroom?.id === item.id} onClick={() => setSelected(item.id)}
                    className="block w-full rounded-card border border-border px-3 py-2 text-left break-words aria-pressed:border-accent">
                    {item.name}
                  </button>
                ))}
              </nav>
            )}
          </aside>
          {classroom && (
            <div className="min-w-0">
              <button type="button" onClick={() => setRevision((value) => value + 1)}
                className="mb-3 rounded-card border border-border px-3 py-1 text-sm hover:bg-navbar-bg">
                Refresh classroom
              </button>
              <ClassroomDetails key={`${classroom.id}:${revision}`} classroom={classroom} teacher={teacher} />
            </div>
          )}
          {classrooms?.length === 0 && <p className="text-sm text-text-muted">{teacher ? 'Create a classroom to get a join code.' : 'Enter a join code from your teacher.'}</p>}
        </div>
      </main>
    </PageWrapper>
  );
}
