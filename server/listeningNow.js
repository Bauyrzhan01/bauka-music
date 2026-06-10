const sessions = new Map();
const TTL_MS = 2 * 60 * 1000;

function sessionKey(payload) {
  return payload.userId || payload.userEmail || payload.userName || 'anonymous';
}

function recordHeartbeat(payload) {
  const key = sessionKey(payload);
  const isPlaying = payload.isPlaying === true || payload.isPlaying === 'true';

  if (!isPlaying || !payload.trackId) {
    sessions.delete(key);
    return null;
  }

  const entry = {
    userName: String(payload.userName || 'Слушатель').trim() || 'Слушатель',
    userEmail: String(payload.userEmail || payload.userId || '').trim(),
    trackId: String(payload.trackId),
    title: String(payload.title || 'Трек').trim(),
    artist: String(payload.artist || '').trim(),
    updatedAt: Date.now(),
  };

  sessions.set(key, entry);
  return entry;
}

function getNowPlaying(limit = 8) {
  const cutoff = Date.now() - TTL_MS;
  return [...sessions.values()]
    .filter((entry) => entry.updatedAt >= cutoff)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

function pruneExpired() {
  const cutoff = Date.now() - TTL_MS;
  sessions.forEach((entry, key) => {
    if (entry.updatedAt < cutoff) sessions.delete(key);
  });
}

module.exports = {
  recordHeartbeat,
  getNowPlaying,
  pruneExpired,
};
