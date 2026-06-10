const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

function weekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function emptyStore() {
  return {
    updatedAt: new Date().toISOString(),
    trackPlaySeconds: {},
    clipViews: {},
    reelViews: {},
    entryScreens: {},
    users: {},
  };
}

function readStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ANALYTICS_FILE)) {
    return emptyStore();
  }
  try {
    return { ...emptyStore(), ...JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8')) };
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  store.updatedAt = new Date().toISOString();
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2));
}

function bump(map, key, amount = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + amount;
}

function ensureUser(store, userKey) {
  const key = userKey || 'anonymous';
  if (!store.users[key]) {
    store.users[key] = { weeks: {}, tracks: {} };
  }
  return store.users[key];
}

function recordListeningTick(payload = {}) {
  const store = readStore();
  const trackId = payload.trackId ? String(payload.trackId) : null;
  const authorId = payload.authorId ? String(payload.authorId) : null;
  const userKey = String(payload.userEmail || payload.userId || 'anonymous').trim();
  const seconds = Math.max(0, Math.min(Number(payload.elapsedSec) || 0, 120));
  const screen = payload.screen ? String(payload.screen) : null;

  if (screen) bump(store.entryScreens, screen, 1);

  if (payload.clipOpen && trackId) {
    bump(store.clipViews, trackId, 1);
  }

  if (payload.reelId) {
    bump(store.reelViews, String(payload.reelId), 1);
  }

  if (trackId && seconds > 0 && payload.isPlaying) {
    bump(store.trackPlaySeconds, trackId, seconds);
    const user = ensureUser(store, userKey);
    const wk = weekKey();
    if (!user.weeks[wk]) user.weeks[wk] = 0;
    user.weeks[wk] += seconds / 60;
    if (!user.tracks[trackId]) user.tracks[trackId] = 0;
    user.tracks[trackId] += seconds;
    if (authorId) {
      const authorKey = `author:${authorId}`;
      if (!user.tracks[authorKey]) user.tracks[authorKey] = 0;
      user.tracks[authorKey] += seconds;
    }
  }

  writeStore(store);
  return store;
}

function topEntries(map, limit = 10) {
  return Object.entries(map || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

function getAdminSummary() {
  const store = readStore();
  return {
    updatedAt: store.updatedAt,
    topTracks: topEntries(store.trackPlaySeconds, 12),
    topClips: topEntries(store.clipViews, 12),
    topReels: topEntries(store.reelViews, 12),
    entryScreens: topEntries(store.entryScreens, 12),
    totalListenMinutes: Math.round(
      Object.values(store.trackPlaySeconds).reduce((sum, v) => sum + v, 0) / 60
    ),
    activeUsers: Object.keys(store.users).length,
  };
}

function getUserStats(userKey) {
  const store = readStore();
  const key = String(userKey || 'anonymous').trim();
  const user = store.users[key];
  if (!user) {
    return {
      weekMinutes: 0,
      topTracks: [],
      soulAuthorId: null,
      soulAuthorLabel: null,
    };
  }

  const wk = weekKey();
  const weekMinutes = Math.round(user.weeks[wk] || 0);

  const trackEntries = Object.entries(user.tracks).filter(
    ([id]) => !id.startsWith('author:')
  );
  const topTracks = trackEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trackId, seconds]) => ({
      trackId,
      seconds: Math.round(seconds),
    }));

  const authorEntries = Object.entries(user.tracks)
    .filter(([id]) => id.startsWith('author:'))
    .sort((a, b) => b[1] - a[1]);
  const topAuthor = authorEntries[0];

  return {
    weekMinutes,
    topTracks,
    soulAuthorId: topAuthor ? topAuthor[0].replace('author:', '') : null,
    soulAuthorLabel: null,
  };
}

module.exports = {
  recordListeningTick,
  getAdminSummary,
  getUserStats,
  weekKey,
};
