import { Platform } from 'react-native';

/** Мобильное приложение работает только с локальными данными, без API. */
export function isStandaloneApp() {
  return Platform.OS !== 'web';
}
