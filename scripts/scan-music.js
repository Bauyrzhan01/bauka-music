const fs = require('fs');
const path = require('path');

const { MUSIC_DIR, AUDIO_EXT } = require('./musicPaths');
const OUT_FILE = path.join(__dirname, '..', 'data', 'localTracks.generated.js');
const AUTHORS_FILE = path.join(__dirname, '..', 'server', 'data', 'authors.json');
const TRACKS_META_FILE = path.join(__dirname, '..', 'server', 'data', 'tracks-meta.json');
const {
  COVERS_DIR,
  coverExists,
  coverFilenameFor,
  extractAllCovers,
} = require('./extract-track-covers');

const BUNDLED_COVERS_DIR = path.join(__dirname, '..', 'assets', 'covers');

function capitalizeWords(text) {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTitle(filename) {
  const base = path.basename(filename, path.extname(filename));
  return capitalizeWords(
    base
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Artist_-_Title_12345.mp3 → { artist, title } */
function parseFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  const match = base.match(/^(.+?)_-_(.+)$/);
  if (!match) {
    return { artist: '', title: formatTitle(filename) };
  }

  const artist = capitalizeWords(match[1].replace(/_/g, ' ').trim());
  const title = capitalizeWords(
    match[2]
      .replace(/_/g, ' ')
      .replace(/\s+\d{5,}$/, '')
      .trim()
  );

  return { artist, title };
}

function syncBundledCovers(tracks) {
  fs.mkdirSync(BUNDLED_COVERS_DIR, { recursive: true });
  for (const name of fs.readdirSync(BUNDLED_COVERS_DIR)) {
    if (name !== '.gitkeep') {
      fs.unlinkSync(path.join(BUNDLED_COVERS_DIR, name));
    }
  }

  for (const track of tracks) {
    if (!track.coverFile) continue;
    const src = path.join(COVERS_DIR, track.coverFile);
    const dest = path.join(BUNDLED_COVERS_DIR, track.coverFile);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
}

function readAuthors() {
  if (!fs.existsSync(AUTHORS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(AUTHORS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function readTracksMeta() {
  if (!fs.existsSync(TRACKS_META_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(TRACKS_META_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function listMusicFiles() {
  if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
    return [];
  }

  return fs
    .readdirSync(MUSIC_DIR)
    .filter((file) => AUDIO_EXT.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'ru'));
}

function buildTrackList(files = listMusicFiles()) {
  const metaMap = readTracksMeta();
  const authors = readAuthors();
  const authorById = Object.fromEntries(authors.map((author) => [author.id, author]));

  return files.map((file, index) => {
    const meta = metaMap[file] || {};
    const author = meta.authorId ? authorById[meta.authorId] : null;
    const parsed = parseFilename(file);

    const coverFile =
      meta.coverFile ||
      (coverExists(file) ? coverFilenameFor(file) : null);

    return {
      id: meta.id || `local-${index}`,
      filename: file,
      title: meta.title || parsed.title || formatTitle(file),
      artist: author?.name || meta.artistName || parsed.artist || '',
      authorId: meta.authorId || null,
      description: meta.description || '',
      lyricsTimings: Array.isArray(meta.lyricsTimings) ? meta.lyricsTimings : [],
      clipUrl: meta.clipUrl || meta.youtubeUrl || '',
      coverFile,
    };
  });
}

async function scanMusic() {
  const files = listMusicFiles();
  await extractAllCovers(files);
  const tracks = buildTrackList(files);
  syncBundledCovers(tracks);

  const entries = tracks.map((track) => {
    const safePath = track.filename.replace(/\\/g, '/');
    const coverLine = track.coverFile
      ? `\n    cover: require('../assets/covers/${track.coverFile.replace(/\\/g, '/')}'),`
      : '';
    return `  {
    id: ${JSON.stringify(track.id)},
    title: ${JSON.stringify(track.title)},
    artist: ${JSON.stringify(track.artist)},
    authorId: ${JSON.stringify(track.authorId)},
    description: ${JSON.stringify(track.description)},
    lyricsTimings: ${JSON.stringify(track.lyricsTimings || [])},
    clipUrl: ${JSON.stringify(track.clipUrl || '')},
    filename: ${JSON.stringify(track.filename)},
    coverFile: ${JSON.stringify(track.coverFile || null)},${coverLine}
    file: require('../music/${safePath}'),
  }`;
  });

  const content = `// Сгенерировано автоматически — не редактируйте
// Метаданные: админка → Музыка / Авторы

export const LOCAL_TRACKS = [
${entries.join(',\n')}
];
`;

  fs.writeFileSync(OUT_FILE, content);
  return tracks;
}

module.exports = {
  scanMusic,
  listMusicFiles,
  buildTrackList,
  formatTitle,
  MUSIC_DIR,
  AUDIO_EXT,
};

if (require.main === module) {
  scanMusic()
    .then((tracks) => {
      const withCover = tracks.filter((t) => t.coverFile).length;
      console.log(`[music] Найдено треков: ${tracks.length}, обложек: ${withCover}`);
      tracks.forEach((track) =>
        console.log(`  - ${track.title} (${track.filename})`)
      );
    })
    .catch((err) => {
      console.error('[music] scan failed', err);
      process.exit(1);
    });
}
