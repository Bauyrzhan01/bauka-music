import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTHORS_KEY = '@bauka-music/local-authors';

export async function loadLocalAuthors() {
  try {
    const raw = await AsyncStorage.getItem(AUTHORS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveLocalAuthors(authors) {
  await AsyncStorage.setItem(AUTHORS_KEY, JSON.stringify(authors));
}
