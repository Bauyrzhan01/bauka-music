export function normalizeAuthor(author) {
  if (!author || typeof author !== 'object') return null;

  return {
    ...author,
    name: String(author.name || '').trim() || 'Автор',
  };
}
