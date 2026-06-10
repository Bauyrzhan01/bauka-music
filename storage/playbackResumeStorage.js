import AsyncStorage from '@react-native-async-storage/async-storage';

const RESUME_KEY = '@bauka-music/playback-resume';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function loadPlaybackResume() {
  try {
    const raw = await AsyncStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.trackId || typeof data.positionMillis !== 'number') {
      return null;
    }
    if (data.savedAt && Date.now() - data.savedAt > MAX_AGE_MS) {
      await clearPlaybackResume();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function savePlaybackResume(payload) {
  await AsyncStorage.setItem(
    RESUME_KEY,
    JSON.stringify({
      ...payload,
      savedAt: Date.now(),
    })
  );
}

export async function clearPlaybackResume() {
  await AsyncStorage.removeItem(RESUME_KEY);
}
