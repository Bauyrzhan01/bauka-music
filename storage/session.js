import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@bauka-music/session';

export async function loadSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user?.email) return user;
    return null;
  } catch {
    return null;
  }
}

export async function saveSession(user) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
