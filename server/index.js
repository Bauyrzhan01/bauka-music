require('./loadEnv');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {
  scanMusic,
  listMusicFiles,
  MUSIC_DIR,
  AUDIO_EXT,
} = require('../scripts/scan-music');
const {
  getTracksWithAuthors,
  readAuthors,
  createAuthor,
  updateAuthor,
  getAuthorWithTracks,
  deleteAuthor,
  updateTrackMeta,
} = require('./musicCatalog');
const { attachCoverUrls } = require('./trackCovers');
const {
  AUTHOR_AVATARS_DIR,
  ensureAuthorAvatarsDir,
  safeAuthorId,
  attachAuthorAvatarUrl,
} = require('./authorAvatars');
const { autoSyncKaraoke } = require('./karaokeAuto');
const { aiSyncKaraoke, getGeminiConfig } = require('./karaokeGemini');
const {
  recordHeartbeat,
  getNowPlaying,
  pruneExpired,
} = require('./listeningNow');
const {
  recordListeningTick,
  getAdminSummary,
  getUserStats,
} = require('./analyticsStore');
const { getLanIpv4Addresses } = require('../scripts/lan-address');
const {
  VERSIONS_DIR,
  AVATARS_DIR,
  VERSION_EXT,
  listVersionsForTrack,
  listAllVersions,
  createVersion,
  deleteVersion,
  ensureVersionStore,
} = require('./trackVersions');
const {
  APK_NAME,
  APK_PATH,
  ICON_PATH,
  apkAvailable,
  ensureDownloadsDir,
  renderDownloadPage,
} = require('./appDownload');

const AVATAR_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function avatarFilenameForEmail(email) {
  const safe = String(email || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 64) || 'user';
  return `${safe}.jpg`;
}

const PORT = 3001;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'banners.json');
const UPLOADS_DIR = path.join(ROOT, 'uploads');

function ensureDirs() {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
  }
}

function uniqueMusicFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const rawBase = path.basename(originalName, ext);
  const base =
    rawBase
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ_\-\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'track';

  let candidate = `${base}${ext}`;
  let counter = 1;

  while (fs.existsSync(path.join(MUSIC_DIR, candidate))) {
    candidate = `${base} (${counter})${ext}`;
    counter += 1;
  }

  return candidate;
}

function readBanners() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeBanners(banners) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(banners, null, 2));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

ensureDirs();
ensureVersionStore();
ensureAuthorAvatarsDir();
ensureDownloadsDir();

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${createId()}${ext}`);
  },
});

const upload = multer({ storage });

const authorAvatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureAuthorAvatarsDir();
    cb(null, AUTHOR_AVATARS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const safeExt = allowed.includes(ext) ? ext : '.jpg';
    cb(null, `${safeAuthorId(req.params.id)}${safeExt}`);
  },
});

const authorAvatarUpload = multer({
  storage: authorAvatarStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (AVATAR_EXT.has(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Аватар: jpg, png или webp'));
  },
});

const musicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
    cb(null, MUSIC_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, uniqueMusicFilename(file.originalname));
  },
});

const musicUpload = multer({
  storage: musicStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (AUDIO_EXT.has(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Поддерживаются только .mp3, .m4a, .wav, .aac'));
  },
});

const versionStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === 'avatar') {
      fs.mkdirSync(AVATARS_DIR, { recursive: true });
      cb(null, AVATARS_DIR);
      return;
    }
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    cb(null, VERSIONS_DIR);
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      cb(null, avatarFilenameForEmail(req.body?.userEmail));
      return;
    }
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    cb(null, `${createId()}${ext}`);
  },
});

const versionUpload = multer({
  storage: versionStorage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'avatar') {
      if (AVATAR_EXT.has(ext)) {
        cb(null, true);
        return;
      }
      cb(new Error('Аватар: jpg, png или webp'));
      return;
    }
    if (VERSION_EXT.has(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Формат: mp3, m4a, wav, aac, mp4, mov, webm'));
  },
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/music', express.static(MUSIC_DIR));
app.use('/versions', express.static(VERSIONS_DIR));

function withFullUrls(banners, req) {
  const host = req.headers.host;
  const protocol = req.protocol;
  return banners.map((banner) => ({
    ...banner,
    imageUri: banner.imagePath
      ? `${protocol}://${host}${banner.imagePath}`
      : null,
  }));
}

app.get('/api/banners', (req, res) => {
  const banners = readBanners();
  res.json(withFullUrls(banners, req));
});

app.post('/api/banners', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Нужно фото' });
    return;
  }

  const active = req.body.active === 'true' || req.body.active === true;
  const banners = readBanners();
  const banner = {
    id: createId(),
    imagePath: `/uploads/${req.file.filename}`,
    active,
  };
  banners.push(banner);
  writeBanners(banners);
  res.json(withFullUrls([banner], req)[0]);
});

app.patch('/api/banners/:id', upload.single('image'), (req, res) => {
  const banners = readBanners();
  const index = banners.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Не найден' });
    return;
  }

  const banner = { ...banners[index] };

  if (req.body.active !== undefined) {
    banner.active = req.body.active === 'true' || req.body.active === true;
  }

  if (req.file) {
    if (banner.imagePath) {
      const oldPath = path.join(ROOT, banner.imagePath.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    banner.imagePath = `/uploads/${req.file.filename}`;
  }

  banners[index] = banner;
  writeBanners(banners);
  res.json(withFullUrls([banner], req)[0]);
});

app.delete('/api/banners/:id', (req, res) => {
  const banners = readBanners();
  const index = banners.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Не найден' });
    return;
  }

  const [removed] = banners.splice(index, 1);
  if (removed.imagePath) {
    const filePath = path.join(ROOT, removed.imagePath.replace(/^\//, ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  writeBanners(banners);
  res.json({ ok: true });
});

function catalogResponse(req) {
  const { tracks, authors } = getTracksWithAuthors();
  return {
    tracks: attachCoverUrls(tracks, req),
    authors: authors.map((author) => attachAuthorAvatarUrl(author, req)),
  };
}

app.get('/api/music', (req, res) => {
  res.json(catalogResponse(req));
});

app.patch('/api/music/:filename', async (req, res) => {
  try {
    const track = await updateTrackMeta(req.params.filename, req.body);
    if (!track) {
      res.status(404).json({ error: 'Трек не найден' });
      return;
    }
    res.json({ ok: true, track, ...catalogResponse(req) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/music/:filename/karaoke/autosync', async (req, res) => {
  try {
    const description =
      req.body?.description != null ? String(req.body.description) : '';
    const save = Boolean(req.body?.save);
    const result = await autoSyncKaraoke(req.params.filename, description, {
      save,
    });
    const payload = { ok: true, ...result };
    if (save) {
      Object.assign(payload, catalogResponse(req));
    }
    res.json(payload);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/karaoke/ai-config', (_req, res) => {
  res.json({ ok: true, ...getGeminiConfig() });
});

app.post('/api/music/:filename/karaoke/ai-sync', async (req, res) => {
  try {
    const description =
      req.body?.description != null ? String(req.body.description) : '';
    const save = Boolean(req.body?.save);
    const result = await aiSyncKaraoke(req.params.filename, description, {
      save,
    });
    const payload = { ok: true, ...result };
    if (save) {
      Object.assign(payload, catalogResponse(req));
    }
    res.json(payload);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/authors', (req, res) => {
  const authors = readAuthors().map((author) => {
    const withTracks = {
      ...author,
      trackCount: getTracksWithAuthors().tracks.filter(
        (track) => track.authorId === author.id
      ).length,
    };
    return attachAuthorAvatarUrl(withTracks, req);
  });
  res.json({ authors });
});

app.post('/api/authors', async (req, res) => {
  try {
    const author = attachAuthorAvatarUrl(await createAuthor(req.body), req);
    res.json({ ok: true, author });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/authors/:id', (req, res) => {
  const author = getAuthorWithTracks(req.params.id);
  if (!author) {
    res.status(404).json({ error: 'Автор не найден' });
    return;
  }
  res.json({ author: attachAuthorAvatarUrl(author, req) });
});

app.patch(
  '/api/authors/:id',
  authorAvatarUpload.single('avatar'),
  async (req, res) => {
    try {
      const payload = { ...req.body };
      if (req.file) {
        payload.avatarPath = `/uploads/authors/${req.file.filename}`;
      }
      const author = await updateAuthor(req.params.id, payload);
      if (!author) {
        res.status(404).json({ error: 'Автор не найден' });
        return;
      }
      res.json({ ok: true, author: attachAuthorAvatarUrl(author, req) });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

app.delete('/api/authors/:id', async (req, res) => {
  const ok = await deleteAuthor(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'Автор не найден' });
    return;
  }
  res.json({ ok: true, ...catalogResponse(req) });
});

app.post('/api/music', musicUpload.array('tracks', 30), async (req, res) => {
  if (!req.files?.length) {
    res.status(400).json({ error: 'Выберите аудиофайлы (.mp3, .m4a, .wav, .aac)' });
    return;
  }

  await scanMusic();
  const uploaded = req.files.map((file) => file.filename);

  res.json({
    ok: true,
    uploaded,
    ...catalogResponse(req),
    message: `Добавлено файлов: ${uploaded.length}. Сохранено в music/`,
  });
});

app.delete('/api/music/:filename', async (req, res) => {
  const filename = path.basename(decodeURIComponent(req.params.filename));
  const ext = path.extname(filename).toLowerCase();

  if (!AUDIO_EXT.has(ext)) {
    res.status(400).json({ error: 'Неверный файл' });
    return;
  }

  const filePath = path.join(MUSIC_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Файл не найден' });
    return;
  }

  fs.unlinkSync(filePath);
  await scanMusic();
  res.json({ ok: true, ...catalogResponse(req) });
});

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Файл слишком большой (макс. 50 МБ)' });
      return;
    }
  }
  if (err?.message) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

app.get('/api/versions', (req, res) => {
  const versions = listAllVersions(req);
  res.json({ versions });
});

app.get('/api/tracks/:trackId/versions', (req, res) => {
  const filename = req.query.filename
    ? String(req.query.filename)
    : '';
  const versions = listVersionsForTrack(req.params.trackId, filename, req);
  res.json({ versions });
});

app.post(
  '/api/tracks/:trackId/versions',
  versionUpload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const mediaFile = req.files?.media?.[0];
      const avatarFile = req.files?.avatar?.[0];
      if (!mediaFile) {
        res.status(400).json({ error: 'Выберите аудио или видео' });
        return;
      }
      const version = createVersion(
        {
          ...req.body,
          baseTrackId: req.params.trackId,
        },
        mediaFile,
        avatarFile,
        req
      );
      res.json({ ok: true, version });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

app.delete('/api/versions/:id', (req, res) => {
  const userEmail = req.query.userEmail || req.body?.userEmail;
  const result = deleteVersion(req.params.id, userEmail);
  if (!result.ok) {
    if (result.reason === 'forbidden') {
      res.status(403).json({ error: 'Можно удалять только свои видео' });
      return;
    }
    res.status(404).json({ error: 'Версия не найдена' });
    return;
  }
  res.json({ ok: true });
});

function profileAvatarPathForEmail(email) {
  return `/uploads/avatars/${avatarFilenameForEmail(email)}`;
}

function resolveProfileAvatarFile(email) {
  const rel = profileAvatarPathForEmail(email);
  const abs = path.join(AVATARS_DIR, path.basename(rel));
  if (fs.existsSync(abs)) return rel;
  return null;
}

const profileAvatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(AVATARS_DIR, { recursive: true });
      cb(null, AVATARS_DIR);
    },
    filename: (req, _file, cb) => {
      cb(null, avatarFilenameForEmail(req.body?.email));
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (AVATAR_EXT.has(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Аватар: jpg, png или webp'));
  },
});

app.get('/api/profile/avatar', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'Укажите email' });
    return;
  }
  const avatarPath = resolveProfileAvatarFile(email);
  res.json({ avatarPath });
});

app.post('/api/profile/avatar', profileAvatarUpload.single('avatar'), (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Укажите email' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Выберите фото' });
      return;
    }
    const avatarPath = profileAvatarPathForEmail(email);
    res.json({ ok: true, avatarPath });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/listening/heartbeat', (req, res) => {
  pruneExpired();
  const body = req.body || {};
  const entry = recordHeartbeat(body);
  try {
    recordListeningTick({
      ...body,
      elapsedSec: body.elapsedSec ?? 20,
    });
  } catch {
    // analytics optional
  }
  res.json({ ok: true, entry });
});

app.get('/api/analytics/summary', (_req, res) => {
  res.json(getAdminSummary());
});

app.get('/api/analytics/user', (req, res) => {
  const email = req.query.email || req.query.userEmail;
  res.json(getUserStats(email));
});

app.get('/api/listening/now', (_req, res) => {
  pruneExpired();
  res.json({ listeners: getNowPlaying() });
});

app.get('/api/health', (_req, res) => {
  const features = ['versions', 'listening', 'karaoke-autosync', 'analytics'];
  const gemini = getGeminiConfig();
  if (gemini.configured) {
    features.push('karaoke-gemini');
  }
  res.json({
    ok: true,
    version: 3,
    features,
    karaokeAi: gemini,
  });
});

app.get('/api/network', (_req, res) => {
  res.json({
    lanIps: getLanIpv4Addresses(),
    apiPort: PORT,
    webPort: 8081,
  });
});

app.get('/app', (req, res) => {
  res.type('html').send(renderDownloadPage(req, { version: '1.0.0' }));
});

app.get('/app/icon.png', (_req, res) => {
  if (!fs.existsSync(ICON_PATH)) {
    res.status(404).end();
    return;
  }
  res.sendFile(ICON_PATH);
});

app.get(`/app/${APK_NAME}`, (_req, res) => {
  if (!apkAvailable()) {
    res.status(404).type('text/plain').send('APK не найден. Запустите: npm run app:prepare');
    return;
  }
  const stat = fs.statSync(APK_PATH);
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${APK_NAME}"`);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(APK_PATH).pipe(res);
});

function logStartupUrls() {
  console.log(`[bauka-api] http://localhost:${PORT}`);
  getLanIpv4Addresses().forEach((ip) => {
    console.log(`[bauka-api] Wi-Fi API: http://${ip}:${PORT}`);
    console.log(`[bauka-api] Скачать приложение: http://${ip}:${PORT}/app`);
    console.log(`[bauka-api] Админка (телефон): http://${ip}:8081`);
  });
  console.log('[bauka-api] Скачать приложение: http://localhost:' + PORT + '/app');
  console.log('[bauka-api] Админка (ноутбук/Cursor): http://localhost:8081');
  console.log('[bauka-api] API v3: музыка, авторы, контенты пользователей');
  if (!apkAvailable()) {
    console.log('[bauka-api] APK не найден — npm run app:prepare');
  }
}

app.listen(PORT, '0.0.0.0', () => {
  logStartupUrls();
});
