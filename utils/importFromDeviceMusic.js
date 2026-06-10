import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export async function requestDeviceMusicPermission() {
  if (Platform.OS === 'web') {
    return { ok: false, error: 'Доступно только в приложении на телефоне' };
  }

  const current = await MediaLibrary.getPermissionsAsync();
  if (current.granted) {
    return { ok: true };
  }

  const requested = await MediaLibrary.requestPermissionsAsync();
  if (requested.granted) {
    return { ok: true };
  }

  return {
    ok: false,
    error: 'Разрешите доступ к музыке в настройках телефона',
  };
}

export async function fetchDeviceMusicPage({ first = 80, after } = {}) {
  const permission = await requestDeviceMusicPermission();
  if (!permission.ok) {
    throw new Error(permission.error);
  }

  return MediaLibrary.getAssetsAsync({
    mediaType: MediaLibrary.MediaType.audio,
    first,
    after,
    sortBy: [MediaLibrary.SortBy.modificationTime],
  });
}

export async function resolveDeviceMusicUri(asset) {
  const info = await MediaLibrary.getAssetInfoAsync(asset, {
    shouldDownloadFromNetwork: false,
  });
  return info.localUri || info.uri || asset.uri;
}

export function deviceAssetTitle(asset) {
  const title = String(asset.filename || '')
    .replace(/\.[^.]+$/i, '')
    .trim();
  return title || 'Без названия';
}

export function deviceAssetArtist(asset) {
  const artist = String(asset.albumArtist || asset.artist || '').trim();
  return artist || 'Неизвестный исполнитель';
}
