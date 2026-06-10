import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = '@bauka-music/listener-stats';

function weekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function emptyStats() {
  return { weeks: {}, tracks: {}, authors: {} };
}

export async function loadListenerStats() {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return emptyStats();
    return { ...emptyStats(), ...JSON.parse(raw) };
  } catch {
    return emptyStats();
  }
}

export async function recordListenTick({ trackId, authorId, seconds = 20 }) {
  if (!trackId || seconds <= 0) return loadListenerStats();

  const stats = await loadListenerStats();
  const wk = weekKey();

  if (!stats.weeks[wk]) stats.weeks[wk] = 0;
  stats.weeks[wk] += seconds / 60;

  if (!stats.tracks[trackId]) stats.tracks[trackId] = 0;
  stats.tracks[trackId] += seconds;

  if (authorId) {
    if (!stats.authors[authorId]) stats.authors[authorId] = 0;
    stats.authors[authorId] += seconds;
  }

  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

export function computeListenerInsights(stats, catalogTracks = []) {
  const wk = weekKey();
  const weekMinutes = Math.round(stats.weeks[wk] || 0);

  const byId = Object.fromEntries(catalogTracks.map((t) => [t.id, t]));

  const topTracks = Object.entries(stats.tracks || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trackId, seconds]) => ({
      trackId,
      seconds: Math.round(seconds),
      title: byId[trackId]?.title || 'Трек',
      artist: byId[trackId]?.artist || '',
    }));

  const topAuthorEntry = Object.entries(stats.authors || {}).sort(
    (a, b) => b[1] - a[1]
  )[0];

  let soulAuthorLabel = null;
  if (topAuthorEntry) {
    const authorId = topAuthorEntry[0];
    const sample = catalogTracks.find((t) => t.authorId === authorId);
    soulAuthorLabel = sample?.artist || 'Любимый автор';
  }

  return {
    weekMinutes,
    topTracks,
    soulAuthorLabel,
  };
}
