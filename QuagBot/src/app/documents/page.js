"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UploadPDFDialog } from '../components/Chat/UploadPDF';
import PageWrapper from '../components/Layout/PageWrapper';

const fields = [
  ['status', 'Processing status'],
  ['embedding_status', 'Embedding status'],
  ['chunk_count', 'Chunk count'],
];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);

  const savedById = new Map(documents.map((document) => [document.id, document]));
  for (const upload of recentUploads) {
    const saved = savedById.get(upload.id);
    savedById.set(upload.id, saved ? { ...saved, status: saved.status ?? upload.status } : upload);
  }
  const visibleDocuments = [...savedById.values()];

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/documents', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.error || 'Could not load documents.');
        }
        if (!controller.signal.aborted) setDocuments(data);
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message || 'Could not load documents.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [refresh]);

  function refreshDocuments() {
    setLoading(true);
    setError(null);
    setRefresh((previous) => previous + 1);
  }

  return (
    <PageWrapper className="overflow-y-auto">
      <main className="mx-auto w-full max-w-4xl p-space-5">
        <div className="mb-space-4 flex flex-wrap items-center justify-between gap-space-2">
          <h1 className="text-xl font-semibold text-text">Documents</h1>
          <div className="flex flex-wrap gap-space-2">
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="cursor-pointer rounded-card bg-accent px-space-3 py-space-2 text-sm text-accent-contrast"
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={refreshDocuments}
              disabled={loading}
              className="cursor-pointer rounded-card border border-border bg-surface px-space-3 py-space-2 text-sm text-text enabled:hover:bg-navbar-bg disabled:opacity-50"
            >
              Refresh status
            </button>
          </div>
        </div>
        {loading && <p role="status">Checking document status…</p>}
        {error && <p role="alert" className="text-error">{error}</p>}
        {!loading && !error && visibleDocuments.length === 0 && (
          <p>No education documents found for your account.</p>
        )}
        <ul className="flex flex-col gap-space-3">
          {visibleDocuments.map((document) => (
            <li key={document.id} className="rounded-card border border-border bg-surface p-space-4">
              <h2 className="mb-space-2 font-semibold break-words">{document.filename}</h2>
              <dl className="grid gap-space-3 text-sm sm:grid-cols-3">
                {fields.map(([key, label]) => (
                  <div key={key} className="min-w-0">
                    <dt className="text-text-muted">{label}</dt>
                    <dd className="break-words">{document[key] ?? 'Unavailable'}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href={{ pathname: '/', query: { askDocument: document.filename } }}
                className="mt-space-3 inline-block text-sm font-medium underline"
              >
                Ask in chat
              </Link>
            </li>
          ))}
        </ul>
        <UploadPDFDialog
          userPDFOpen={uploadOpen}
          setUserPDFOpen={setUploadOpen}
          onUploaded={(document) => {
            setRecentUploads((previous) => [document, ...previous.filter((item) => item.id !== document.id)]);
            refreshDocuments();
          }}
        />
      </main>
    </PageWrapper>
  );
}
