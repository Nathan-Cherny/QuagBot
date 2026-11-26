export function describeDocument(document) {
  const status = document.embedding_status;
  if (status === 'completed' && document.chunk_count > 0) return 'Ready to ask';
  if (status === 'completed' && document.chunk_count === 0) return 'No searchable text';
  if (status === 'pending') return 'Processing';
  if (status === 'failed') return 'Processing failed';
  return 'Status unavailable';
}

export function documentQuestion(filename) {
  const name = filename?.trim().slice(0, 255);
  return name ? `What are the main ideas in “${name}”?` : '';
}
