'use client';

import { useEffect, useState } from 'react';

export default function EducationSources() {
  const [sources, setSources] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/education-sources', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error();
        setSources(await response.json());
      } catch {
        if (!controller.signal.aborted) setError('The shared education library is unavailable.');
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return (
    <section className="mt-space-6" aria-labelledby="education-sources">
      <h2 id="education-sources" className="mb-space-3 text-lg font-semibold">Shared education library</h2>
      {error && <p role="alert">{error}</p>}
      {!sources && !error && <p role="status">Loading education sources…</p>}
      {sources?.length === 0 && <p>No shared education sources are available yet.</p>}
      {!!sources?.length && (
        <ul className="space-y-2">
          {sources.map((source) => (
            <li key={source.id} className="rounded-card border border-border p-space-3">
              <p className="font-medium break-words">{source.title}</p>
              {!!source.authors.length && <p className="text-sm text-text-muted">{source.authors.join(', ')}</p>}
              {source.citation && <p className="text-sm text-text-muted break-words">{source.citation}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
