import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@bauka-music/favorite-track-ids';

export async function loadFavoriteIds() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveFavoriteIds(ids) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}
