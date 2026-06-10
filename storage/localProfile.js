import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@bauka-music/local-profile';

export const DEFAULT_LOCAL_PROFILE = {
  name: 'Слушатель',
  email: null,
  role: 'user',
  avatarUri: null,
  avatarAccentColor: '#000000',
  isLocal: true,
};

export async function loadLocalProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_LOCAL_PROFILE };
    return { ...DEFAULT_LOCAL_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_LOCAL_PROFILE };
  }
}

export async function saveLocalProfile(profile) {
  await AsyncStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      name: profile.name,
      avatarUri: profile.avatarUri,
      avatarAccentColor: profile.avatarAccentColor,
      bio: profile.bio || '',
      isLocal: true,
      role: profile.role || 'user',
    })
  );
}

export async function clearLocalProfile() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
