import { loadLocalAuthors, saveLocalAuthors } from '../storage/localAuthorsStorage';
import {
  authorIdFromName,
  normalizeAuthorName,
} from './localAuthors';
import { generatePlaceholderImageFile } from './generatePlaceholderImage';

function shouldAutoAuthor(artistName) {
  const trimmed = String(artistName || '').trim();
  if (!trimmed) return false;
  const norm = normalizeAuthorName(trimmed);
  return norm !== 'я' && norm !== 'неизвестный исполнитель';
}

export async function ensureLocalAuthorForArtist(artistName) {
  if (!shouldAutoAuthor(artistName)) {
    return { ok: false, skipped: true };
  }

  const trimmed = String(artistName).trim();
  const authors = await loadLocalAuthors();
  const norm = normalizeAuthorName(trimmed);
  let author = authors.find((item) => normalizeAuthorName(item.name) === norm);

  if (!author) {
    const avatarUri = await generatePlaceholderImageFile(trimmed, {
      subdir: 'author-avatars',
    });
    author = {
      id: authorIdFromName(trimmed),
      name: trimmed,
      bio: '',
      avatarUri,
      createdAt: new Date().toISOString(),
    };
    await saveLocalAuthors([...authors, author]);
    return { ok: true, created: true, author };
  }

  if (!author.avatarUri) {
    const avatarUri = await generatePlaceholderImageFile(trimmed, {
      subdir: 'author-avatars',
    });
    const next = authors.map((item) =>
      normalizeAuthorName(item.name) === norm
        ? { ...item, avatarUri }
        : item
    );
    await saveLocalAuthors(next);
    return {
      ok: true,
      created: false,
      updated: true,
      author: { ...author, avatarUri },
    };
  }

  return { ok: true, created: false, author };
}
