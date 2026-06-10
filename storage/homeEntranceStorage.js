import AsyncStorage from '@react-native-async-storage/async-storage';

const HOME_ENTRANCE_KEY = '@bauka-music/home-entrance-played';

export async function isHomeEntrancePlayed() {
  try {
    const value = await AsyncStorage.getItem(HOME_ENTRANCE_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function markHomeEntrancePlayed() {
  try {
    await AsyncStorage.setItem(HOME_ENTRANCE_KEY, '1');
  } catch {
    // ignore
  }
}
