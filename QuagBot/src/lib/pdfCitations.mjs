export const pdfCitationsEnabled = process.env.NEXT_PUBLIC_PDF_CITATIONS_ENABLED === 'true';

export function isDocumentId(value) {
  return typeof value === 'string' &&
    /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
}

export function canSelectPdf(id, filename) {
  return pdfCitationsEnabled && isDocumentId(id) && typeof filename === 'string' &&
    filename.trim().toLowerCase().endsWith('.pdf');
}

export function normalizeCitations(records) {
  if (!Array.isArray(records)) return undefined;
  const citations = [];
  const numbers = new Set();
  for (const citation of records) {
    if (!Number.isSafeInteger(citation?.number) || citation.number < 1 || numbers.has(citation.number) ||
        !isDocumentId(citation.document_id) ||
        typeof citation.filename !== 'string' || !citation.filename.trim() ||
        !Number.isSafeInteger(citation.page_number) || citation.page_number < 1) return undefined;
    numbers.add(citation.number);
    citations.push({
      number: citation.number,
      document_id: citation.document_id,
      filename: citation.filename,
      page_number: citation.page_number,
      section_name: typeof citation.section_name === 'string' ? citation.section_name.trim() || null : null,
    });
  }
  return citations;
}
