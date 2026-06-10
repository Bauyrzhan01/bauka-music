import AsyncStorage from '@react-native-async-storage/async-storage';

const LIBRARY_KEY = '@bauka-music/my-library';

export async function loadMyLibraryEntries() {
  try {
    const raw = await AsyncStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveMyLibraryEntries(entries) {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(entries));
}
