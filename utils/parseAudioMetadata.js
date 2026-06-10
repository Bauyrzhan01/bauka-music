import { titleFromFileName } from './myLibraryFiles';

const SKIP_ARTISTS = new Set([
  '',
  'я',
  'неизвестный исполнитель',
  'unknown artist',
  'unknown',
]);

function normalizeArtist(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  if (SKIP_ARTISTS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function parseArtistTitleFromFilename(filename) {
  const base = String(filename || '')
    .replace(/\.[^.]+$/i, '')
    .trim();

  if (!base) {
    return { artist: null, title: 'Без названия' };
  }

  const patterns = [
    /^(.+?)\s*[-–—]\s*(.+)$/,
    /^(.+?)\s+feat\.?\s+(.+)$/i,
    /^(.+?)\s+ft\.?\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = base.match(pattern);
    if (!match) continue;

    const artist = normalizeArtist(match[1]);
    const title = String(match[2] || '').trim();
    if (artist && title) {
      return { artist, title };
    }
  }

  return {
    artist: null,
    title: titleFromFileName(filename),
  };
}

export function resolveImportMetadata({ filename, asset, fallbackArtist = null }) {
  const fromName = parseArtistTitleFromFilename(filename);
  const assetArtist = normalizeArtist(asset?.albumArtist || asset?.artist);

  return {
    title: fromName.title || titleFromFileName(filename),
    artist:
      assetArtist ||
      fromName.artist ||
      normalizeArtist(fallbackArtist) ||
      'Я',
  };
}
