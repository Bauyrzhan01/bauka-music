const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const VERSIONS_FILE = path.join(DATA_DIR, 'track-versions.json');
const VERSIONS_DIR = path.join(__dirname, 'uploads', 'versions');
const AVATARS_DIR = path.join(__dirname, 'uploads', 'avatars');

const VERSION_EXT = new Set([
  '.mp3',
  '.m4a',
  '.wav',
  '.aac',
  '.mp4',
  '.mov',
  '.webm',
  '.m4v',
]);

const TYPE_BY_EXT = {
  '.mp4': 'video',
  '.mov': 'video',
  '.webm': 'video',
  '.m4v': 'video',
};

function ensureVersionStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  if (!fs.existsSync(VERSIONS_FILE)) {
    fs.writeFileSync(VERSIONS_FILE, '[]');
  }
}

function readVersions() {
  ensureVersionStore();
  try {
    return JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeVersions(list) {
  ensureVersionStore();
  fs.writeFileSync(VERSIONS_FILE, JSON.stringify(list, null, 2));
}

function createId() {
  return `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferType(ext, requestedType) {
  if (TYPE_BY_EXT[ext]) return TYPE_BY_EXT[ext];
  if (requestedType === 'video') return 'video';
  return 'edit';
}

function avatarPathForEmail(email) {
  const safe = String(email || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 64) || 'user';
  return `/uploads/avatars/${safe}.jpg`;
}

function resolveStoredAvatarPath(version) {
  if (version.userAvatarPath) return version.userAvatarPath;
  if (!version.userEmail) return null;

  const rel = avatarPathForEmail(version.userEmail);
  const abs = path.join(AVATARS_DIR, path.basename(rel));
  if (fs.existsSync(abs)) return rel;
  return null;
}

function withMediaUrl(version, req) {
  const host = req?.headers?.host;
  const protocol = req?.protocol || 'http';
  const base = host ? `${protocol}://${host}` : '';
  const avatarPath = resolveStoredAvatarPath(version);

  return {
    ...version,
    mediaUrl: version.mediaPath ? `${base}${version.mediaPath}` : null,
    userAvatarUrl: avatarPath ? `${base}${avatarPath}` : null,
  };
}

function normalizeFilename(name) {
  return String(name || '').trim().toLowerCase();
}

function listVersionsForTrack(trackId, filename, req) {
  const list = readVersions();
  const fileKey = normalizeFilename(filename);

  return list
    .filter((item) => {
      if (trackId && item.baseTrackId === trackId) return true;
      if (fileKey && normalizeFilename(item.baseFilename) === fileKey) {
        return true;
      }
      return false;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((item) => withMediaUrl(item, req));
}

function listAllVersions(req) {
  return readVersions()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((item) => withMediaUrl(item, req));
}

function createVersion(payload, file, avatarFile, req) {
  if (!file) {
    throw new Error('Выберите файл');
  }

  const ext = path.extname(file.filename || file.originalname || '').toLowerCase();
  if (!VERSION_EXT.has(ext)) {
    throw new Error('Формат: mp3, m4a, wav, aac, mp4, mov, webm');
  }

  const type = inferType(ext, payload.type);
  const title = String(payload.title || '').trim() || 'Мой контент';
  const userEmail = String(payload.userEmail || '').trim().toLowerCase();
  const userName = String(payload.userName || '').trim() || 'Пользователь';

  if (!userEmail) {
    throw new Error('Укажите email пользователя');
  }

  let userAvatarPath = null;
  if (avatarFile?.filename) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
    userAvatarPath = avatarPathForEmail(userEmail);
  }

  const version = {
    id: createId(),
    baseTrackId: String(payload.baseTrackId || '').trim(),
    baseFilename: String(payload.baseFilename || '').trim(),
    type,
    title,
    description: String(payload.description || '').trim(),
    userEmail,
    userName,
    mediaPath: `/versions/${file.filename}`,
    userAvatarPath,
    createdAt: new Date().toISOString(),
  };

  const list = readVersions();
  list.push(version);
  writeVersions(list);

  return withMediaUrl(version, req);
}

function deleteVersion(id, userEmail) {
  const list = readVersions();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return { ok: false, reason: 'not_found' };

  const removed = list[index];

  if (userEmail) {
    const owner = String(removed.userEmail || '')
      .trim()
      .toLowerCase();
    const requester = String(userEmail).trim().toLowerCase();
    if (!owner || owner !== requester) {
      return { ok: false, reason: 'forbidden' };
    }
  }

  list.splice(index, 1);
  writeVersions(list);

  if (removed.mediaPath) {
    const filePath = path.join(VERSIONS_DIR, path.basename(removed.mediaPath));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  return { ok: true };
}

module.exports = {
  VERSIONS_DIR,
  AVATARS_DIR,
  VERSION_EXT,
  listVersionsForTrack,
  listAllVersions,
  createVersion,
  deleteVersion,
  ensureVersionStore,
};
