import { parseLyricsLines } from './autoLyricsTimings';
import { autoSyncKaraokeLocal } from './karaokeAutoLocal';
import { ensureLocalAuthorForArtist } from './autoAuthorSetup';
import { generatePlaceholderImageFile } from './generatePlaceholderImage';
import { resolveImportMetadata } from './parseAudioMetadata';

export function lyricsNeedAutoSync(description, lyricsTimings = []) {
  const lines = parseLyricsLines(description);
  if (!lines.length) return false;
  if (!lyricsTimings?.length) return true;
  if (lyricsTimings.length !== lines.length) return true;
  return !lyricsTimings.every((value) => typeof value === 'number');
}

export async function buildImportEntryFields({
  filename,
  asset,
  fallbackArtist = null,
}) {
  const meta = resolveImportMetadata({ filename, asset, fallbackArtist });

  return {
    title: meta.title,
    artist: meta.artist,
  };
}

export async function enrichLibraryEntry(entry, options = {}) {
  const {
    author = true,
    cover = true,
    karaoke = true,
  } = options;

  const patch = {};
  const notes = [];

  if (author && entry.artist) {
    const authorResult = await ensureLocalAuthorForArtist(entry.artist);
    if (authorResult.created) notes.push('автор создан');
    else if (authorResult.updated) notes.push('аватар автора');
  }

  if (cover && !entry.coverUri) {
    const coverUri = await generatePlaceholderImageFile(
      `${entry.artist || ''}-${entry.title || ''}`,
      { subdir: 'covers' }
    );
    if (coverUri) {
      patch.coverUri = coverUri;
      notes.push('обложка');
    }
  }

  if (karaoke && entry.audioUri && lyricsNeedAutoSync(entry.description, entry.lyricsTimings)) {
    try {
      const result = await autoSyncKaraokeLocal(entry.audioUri, entry.description);
      patch.lyricsTimings = result.lyricsTimings;
      notes.push('караоке');
    } catch {
      // lyrics may be empty on fresh import
    }
  }

  return { patch, notes };
}

export async function enrichAllLibraryEntries(entries) {
  let authors = 0;
  let covers = 0;
  let karaoke = 0;

  const next = [];

  for (const entry of entries) {
    const { patch, notes } = await enrichLibraryEntry(entry, {
      author: true,
      cover: true,
      karaoke: true,
    });

    if (notes.includes('автор создан') || notes.includes('аватар автора')) {
      authors += 1;
    }
    if (notes.includes('обложка')) covers += 1;
    if (notes.includes('караоке')) karaoke += 1;

    next.push(
      Object.keys(patch).length
        ? { ...entry, ...patch, updatedAt: new Date().toISOString() }
        : entry
    );
  }

  return { entries: next, stats: { authors, covers, karaoke } };
}
