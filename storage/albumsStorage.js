import AsyncStorage from '@react-native-async-storage/async-storage';

const ALBUMS_KEY = '@bauka-music/saved-albums';

export async function loadSavedAlbums() {
  try {
    const raw = await AsyncStorage.getItem(ALBUMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSavedAlbums(albums) {
  await AsyncStorage.setItem(ALBUMS_KEY, JSON.stringify(albums));
}
