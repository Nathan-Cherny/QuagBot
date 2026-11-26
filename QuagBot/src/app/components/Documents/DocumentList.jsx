import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { describeDocument } from '../../../lib/documentStatus.mjs';

const fields = [
  ['status', 'Processing status'],
  ['embedding_status', 'Embedding status'],
  ['chunk_count', 'Chunk count'],
];

const badgeStyle = {
  'Ready to ask': 'bg-green-100 text-green-900',
  Processing: 'bg-amber-100 text-amber-950',
  'Processing failed': 'bg-danger-bg text-error',
  'No searchable text': 'bg-danger-bg text-error',
};

export function DocumentStatus({ document }) {
  const label = describeDocument(document);
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyle[label] ?? 'bg-navbar-bg text-text'}`}>{label}</span>;
}

export function DocumentDetails({ document }) {
  return (
    <details className="mt-space-2 text-sm text-text-muted">
      <summary className="w-fit cursor-pointer">Details</summary>
      <dl className="mt-space-2 grid gap-space-2 sm:grid-cols-3">
        {fields.map(([key, label]) => (
          <div key={key} className="min-w-0">
            <dt>{label}</dt>
            <dd className="break-words text-text">{document[key] ?? 'Unavailable'}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

const NO_UPLOADS = [];

export default function DocumentList({ recentUploads = NO_UPLOADS, onAttach }) {
  const [documents, setDocuments] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [settled, setSettled] = useState(null);
  const latestUpload = recentUploads[0];
  const loading = !settled || settled.refresh !== refresh || settled.latestUpload !== latestUpload;
  const error = loading ? null : settled.error;

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    let processing = recentUploads.some((document) => document.embedding_status === 'pending');

    async function load() {
      let error = null;
      let retryDelay = 5000;
      try {
        const response = await fetch('/api/documents', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          if ([400, 401, 403, 404].includes(response.status)) processing = false;
          const retryAfter = Number(response.headers.get('retry-after'));
          if (retryAfter > 0) retryDelay = Math.max(retryDelay, retryAfter * 1000);
          throw new Error(data?.error || 'Could not load documents.');
        }
        if (controller.signal.aborted) return;
        setDocuments(data);
        const listedIds = new Set(data.map((document) => document.id));
        processing = data.some((document) => document.embedding_status === 'pending') ||
          recentUploads.some((document) => document.embedding_status === 'pending' && !listedIds.has(document.id));
      } catch (cause) {
        error = cause.message || 'Could not load documents.';
      } finally {
        if (!controller.signal.aborted) {
          setSettled({ refresh, latestUpload, error });
          if (processing) timer = setTimeout(load, error ? Math.max(10000, retryDelay) : retryDelay);
        }
      }
    }
    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [refresh, latestUpload, recentUploads]);

  useEffect(() => {
    if (loading || onAttach) return;
    const hash = window.location.hash;
    if (hash.startsWith('#document-')) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' });
    }
  }, [documents, loading, onAttach]);

  const recentById = new Map(recentUploads.map((document) => [document.id, document]));
  const visible = documents.map((document) => {
    const upload = recentById.get(document.id);
    recentById.delete(document.id);
    return upload ? { ...document, status: document.status ?? upload.status } : document;
  });
  visible.unshift(...recentById.values());

  return (
    <>
      <div className="mb-space-3 flex flex-wrap items-center justify-between gap-space-2">
        <div className="text-sm text-text-muted">
          {loading && <p role="status">Checking document status…</p>}
          {error && <p role="alert" className="text-error">{error}</p>}
        </div>
        <button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading}
          className="cursor-pointer rounded-card border border-border px-space-3 py-space-2 text-sm enabled:hover:bg-navbar-bg disabled:opacity-50">
          Refresh status
        </button>
      </div>
      {!loading && !error && visible.length === 0 && (
        <p className="rounded-card border border-dashed border-border p-space-4 text-sm text-text-muted">No education documents found for your account.</p>
      )}
      <ul className="flex flex-col gap-space-3">
        {visible.map((document) => {
          const canAttach = describeDocument(document) === 'Ready to ask' && document.filename.toLowerCase().endsWith('.pdf');
          const row = (
            <>
              <span className="flex min-w-0 items-start gap-space-2">
                <FileText size={18} className="mt-0.5 shrink-0 text-text-muted" aria-hidden="true" />
                <span className="min-w-0 break-all font-semibold">{document.filename}</span>
              </span>
              <DocumentStatus document={document} />
            </>
          );
          const rowClass = 'flex w-full flex-wrap items-center justify-between gap-space-2 rounded-card p-space-3 text-left';
          const selectableRowClass = `${rowClass} cursor-pointer hover:bg-navbar-bg focus-visible:outline-2 focus-visible:outline-accent`;
          return (
            <li key={document.id} id={`document-${document.id}`} className="rounded-card border border-border bg-surface target:border-accent">
              {canAttach ? onAttach ? (
                <button type="button" onClick={() => onAttach(document)} className={selectableRowClass}>
                  {row}
                </button>
              ) : (
                <Link href={{ pathname: '/', query: { askDocument: document.filename, askDocumentId: document.id } }} className={selectableRowClass}>
                  {row}
                </Link>
              ) : (
                <div className={rowClass}>{row}</div>
              )}
              <div className="px-space-3 pb-space-3">
                <DocumentDetails document={document} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
