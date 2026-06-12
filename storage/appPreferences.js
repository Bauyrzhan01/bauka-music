import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@bauka-music/app-preferences';

const DEFAULT_PREFS = {
  hideBundledTracks: false,
  playbackVolume: 1,
};

export async function loadAppPreferences() {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function saveAppPreferences(prefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function setHideBundledTracks(value) {
  const prefs = await loadAppPreferences();
  prefs.hideBundledTracks = !!value;
  await saveAppPreferences(prefs);
  return prefs;
}
