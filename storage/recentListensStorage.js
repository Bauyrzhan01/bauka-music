import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = '@bauka-music/recent-track-ids';
const MAX_RECENT = 20;

export async function loadRecentTrackIds() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function pushRecentTrackId(trackId) {
  if (!trackId) return loadRecentTrackIds();
  const current = await loadRecentTrackIds();
  const next = [trackId, ...current.filter((id) => id !== trackId)].slice(
    0,
    MAX_RECENT
  );
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
