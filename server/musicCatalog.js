const fs = require('fs');
const path = require('path');
const {
  listMusicFiles,
  formatTitle,
  scanMusic,
  buildTrackList,
  MUSIC_DIR,
} = require('../scripts/scan-music');

const { removeAuthorAvatarFiles } = require('./authorAvatars');
const { parseClipUrl } = require('../utils/parseClipUrl.cjs');

const DATA_DIR = path.join(__dirname, 'data');
const AUTHORS_FILE = path.join(DATA_DIR, 'authors.json');
const TRACKS_META_FILE = path.join(DATA_DIR, 'tracks-meta.json');

function ensureCatalogFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(AUTHORS_FILE)) {
    fs.writeFileSync(AUTHORS_FILE, '[]');
  }
  if (!fs.existsSync(TRACKS_META_FILE)) {
    fs.writeFileSync(TRACKS_META_FILE, '{}');
  }
}

function readAuthors() {
  ensureCatalogFiles();
  try {
    return JSON.parse(fs.readFileSync(AUTHORS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAuthors(authors) {
  ensureCatalogFiles();
  fs.writeFileSync(AUTHORS_FILE, JSON.stringify(authors, null, 2));
}

function readTracksMeta() {
  ensureCatalogFiles();
  try {
    return JSON.parse(fs.readFileSync(TRACKS_META_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeTracksMeta(meta) {
  ensureCatalogFiles();
  fs.writeFileSync(TRACKS_META_FILE, JSON.stringify(meta, null, 2));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTracksWithAuthors() {
  const tracks = buildTrackList(listMusicFiles());
  const authors = readAuthors();
  return { tracks, authors };
}

function updateTrackMeta(filename, payload) {
  const safeName = path.basename(filename);
  const filePath = path.join(MUSIC_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const metaMap = readTracksMeta();
  const current = metaMap[safeName] || {};
  const authors = readAuthors();

  if (payload.authorId && !authors.find((item) => item.id === payload.authorId)) {
    throw new Error('Автор не найден');
  }

  const next = {
    ...current,
    id: current.id || createId('track'),
  };

  if (payload.title !== undefined) {
    next.title = String(payload.title).trim() || formatTitle(safeName);
  }
  if (payload.description !== undefined) {
    next.description = String(payload.description).trim();
  }
  if (payload.authorId !== undefined) {
    next.authorId = payload.authorId || null;
    delete next.artistName;
  }
  if (payload.artistName !== undefined && !payload.authorId) {
    next.artistName = String(payload.artistName).trim();
    next.authorId = null;
  }
  const clipPayload =
    payload.clipUrl !== undefined ? payload.clipUrl : payload.youtubeUrl;
  if (clipPayload !== undefined) {
    const raw = String(clipPayload).trim();
    if (!raw) {
      delete next.clipUrl;
      delete next.youtubeUrl;
    } else if (!parseClipUrl(raw)) {
      throw new Error(
        'Некорректная ссылка клипа (YouTube, RuTube, Vimeo или VK)'
      );
    } else {
      next.clipUrl = raw;
      delete next.youtubeUrl;
    }
  }
  if (payload.lyricsTimings !== undefined) {
    const descSource =
      payload.description !== undefined
        ? String(payload.description).trim()
        : String(next.description || '').trim();
    const lines = descSource
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const timings = payload.lyricsTimings;

    if (!Array.isArray(timings)) {
      throw new Error('lyricsTimings должен быть массивом');
    }
    if (lines.length && timings.length !== lines.length) {
      throw new Error('Количество меток должно совпадать с количеством строк');
    }
    timings.forEach((value, index) => {
      const seconds = Number(value);
      if (Number.isNaN(seconds) || seconds < 0) {
        throw new Error(`Неверное время для строки ${index + 1}`);
      }
      if (index > 0 && seconds < timings[index - 1]) {
        throw new Error('Время строк должно идти по порядку');
      }
      timings[index] = Math.round(seconds * 100) / 100;
    });
    next.lyricsTimings = timings;
  }

  metaMap[safeName] = next;
  writeTracksMeta(metaMap);
  return scanMusic().then(
    () => buildTrackList().find((track) => track.filename === safeName)
  );
}

function createAuthor(payload) {
  const name = String(payload.name || '').trim();
  if (!name) {
    throw new Error('Введите имя автора');
  }

  const authors = readAuthors();
  const author = {
    id: createId('author'),
    name,
    bio: String(payload.bio || '').trim(),
    createdAt: new Date().toISOString(),
  };

  authors.push(author);
  writeAuthors(authors);
  return scanMusic().then(() => author);
}

function updateAuthor(id, payload) {
  const authors = readAuthors();
  const index = authors.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const author = { ...authors[index] };

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) throw new Error('Имя автора не может быть пустым');
    author.name = name;
  }
  if (payload.bio !== undefined) {
    author.bio = String(payload.bio).trim();
  }
  if (payload.avatarPath !== undefined) {
    if (!payload.avatarPath && author.avatarPath) {
      removeAuthorAvatarFiles(id);
    }
    author.avatarPath = payload.avatarPath || null;
  }

  authors[index] = author;
  writeAuthors(authors);
  return scanMusic().then(() => ({
    ...author,
    tracks: buildTrackList().filter((track) => track.authorId === id),
  }));
}

function getAuthorWithTracks(id) {
  const authors = readAuthors();
  const author = authors.find((item) => item.id === id);
  if (!author) return null;

  return {
    ...author,
    tracks: buildTrackList().filter((track) => track.authorId === id),
  };
}

function deleteAuthor(id) {
  const authors = readAuthors();
  const index = authors.findIndex((item) => item.id === id);
  if (index === -1) return false;

  const [removed] = authors.splice(index, 1);
  removeAuthorAvatarFiles(removed.id);
  writeAuthors(authors);

  const metaMap = readTracksMeta();
  let changed = false;
  Object.keys(metaMap).forEach((filename) => {
    if (metaMap[filename].authorId === id) {
      metaMap[filename] = { ...metaMap[filename], authorId: null };
      changed = true;
    }
  });
  if (changed) writeTracksMeta(metaMap);

  return scanMusic().then(() => true);
}

module.exports = {
  buildTrackList,
  getTracksWithAuthors,
  readAuthors,
  createAuthor,
  updateAuthor,
  getAuthorWithTracks,
  deleteAuthor,
  updateTrackMeta,
};
