const fs = require('fs');
const path = require('path');

const AUTHOR_AVATARS_DIR = path.join(__dirname, 'uploads', 'authors');

function ensureAuthorAvatarsDir() {
  fs.mkdirSync(AUTHOR_AVATARS_DIR, { recursive: true });
}

function safeAuthorId(authorId) {
  return String(authorId || 'author').replace(/[^a-zA-Z0-9-]/g, '') || 'author';
}

function avatarPathForAuthorId(authorId, ext = '.jpg') {
  return `/uploads/authors/${safeAuthorId(authorId)}${ext}`;
}

function removeAuthorAvatarFiles(authorId) {
  ensureAuthorAvatarsDir();
  const safe = safeAuthorId(authorId);
  const dir = fs.readdirSync(AUTHOR_AVATARS_DIR);
  dir.forEach((file) => {
    if (file.startsWith(safe)) {
      fs.unlinkSync(path.join(AUTHOR_AVATARS_DIR, file));
    }
  });
}

function resolveAvatarPath(author) {
  if (author?.avatarPath) return author.avatarPath;
  if (!author?.id) return null;

  ensureAuthorAvatarsDir();
  const safe = safeAuthorId(author.id);
  const found = fs
    .readdirSync(AUTHOR_AVATARS_DIR)
    .find((file) => file.startsWith(safe));
  if (!found) return null;
  return `/uploads/authors/${found}`;
}

function attachAuthorAvatarUrl(author, req) {
  if (!author) return author;

  const avatarPath = resolveAvatarPath(author);
  const host = req?.headers?.host;
  const protocol = req?.protocol || 'http';
  const base = host ? `${protocol}://${host}` : '';

  const resolvedPath = avatarPath || author.avatarPath || null;

  return {
    ...author,
    avatarPath: resolvedPath,
    // Полный URL для веб-админки; в приложении лучше собирать через resolveServerMediaUrl
    avatarUrl: resolvedPath && base ? `${base}${resolvedPath}` : null,
  };
}

module.exports = {
  AUTHOR_AVATARS_DIR,
  ensureAuthorAvatarsDir,
  safeAuthorId,
  avatarPathForAuthorId,
  removeAuthorAvatarFiles,
  attachAuthorAvatarUrl,
};
