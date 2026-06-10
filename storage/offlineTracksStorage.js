import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_KEY = '@bauka-music/offline-tracks';

export async function loadOfflineTracks() {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveOfflineTracks(entries) {
  await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify(entries));
}
