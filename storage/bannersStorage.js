import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_NBO_BANNERS, normalizeBanner } from '../data/banners';

const BANNERS_KEY = '@bauka-music/nbo-banners';

export async function loadBanners() {
  try {
    const raw = await AsyncStorage.getItem(BANNERS_KEY);
    if (!raw) {
      await AsyncStorage.setItem(BANNERS_KEY, JSON.stringify(DEFAULT_NBO_BANNERS));
      return DEFAULT_NBO_BANNERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_NBO_BANNERS;
    return parsed.map(normalizeBanner);
  } catch {
    return DEFAULT_NBO_BANNERS;
  }
}

export async function saveBanners(banners) {
  const normalized = banners.map(normalizeBanner);
  await AsyncStorage.setItem(BANNERS_KEY, JSON.stringify(normalized));
}
