import { NextResponse } from 'next/server';
import { authenticatedRoute } from '@/lib/ai-route';
import { AIError, listAIDocuments, uploadAIPDF } from '@/lib/ai-backend.mjs';

export const GET = authenticatedRoute(async (request, _body, userId) => {
  const documents = await listAIDocuments({ userId, signal: request.signal });
  return NextResponse.json(documents, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
});

// Next Proxy buffers up to 10 MiB, including the multipart envelope.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const POST = authenticatedRoute(async (request, _body, userId) => {
  if (Number(request.headers.get('content-length')) > MAX_UPLOAD_BYTES) {
    throw new AIError('The PDF upload must be under 10 MB.', 413);
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new AIError('Send one PDF as a multipart upload.', 400);
  }
  const files = form.getAll('files');
  const file = files[0];
  if (files.length !== 1 || !(file instanceof File) || !file.name.toLowerCase().endsWith('.pdf')) {
    throw new AIError('Choose one PDF file.', 400);
  }
  if (file.size >= MAX_UPLOAD_BYTES) {
    throw new AIError('The PDF upload must be under 10 MB.', 413);
  }
  const header = await file.slice(0, 5).text();
  if (header !== '%PDF-') throw new AIError('The selected file is not a valid PDF.', 400);

  const document = await uploadAIPDF({ userId, file, signal: request.signal });
  return NextResponse.json(document, {
    status: 201,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}, { parseBody: false });
