export async function uploadPDF(file, { signal } = {}) {
  const body = new FormData();
  body.append('files', file);
  const response = await fetch('/api/documents', { method: 'POST', body, signal });
  const document = await response.json().catch(() => null);
  if (!response.ok || !document?.id) {
    const fallback = response.status === 413
      ? 'The PDF upload must be under 10 MB.'
      : 'Could not upload the PDF. Please try again.';
    throw new Error(document?.error || fallback);
  }
  return document;
}
