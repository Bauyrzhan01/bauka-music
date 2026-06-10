import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_KEY = '@bauka-music/api-base-url';

export async function loadApiBaseOverride() {
  try {
    const value = await AsyncStorage.getItem(API_BASE_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function saveApiBaseOverride(url) {
  const trimmed = String(url || '').trim().replace(/\/$/, '');
  if (!trimmed) {
    await AsyncStorage.removeItem(API_BASE_KEY);
    return null;
  }
  await AsyncStorage.setItem(API_BASE_KEY, trimmed);
  return trimmed;
}
