import AsyncStorage from '@react-native-async-storage/async-storage';

const REELS_KEY = '@bauka-music/track-reels';

export async function loadTrackReelsMap() {
  try {
    const raw = await AsyncStorage.getItem(REELS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveTrackReelsMap(map) {
  await AsyncStorage.setItem(REELS_KEY, JSON.stringify(map));
}
