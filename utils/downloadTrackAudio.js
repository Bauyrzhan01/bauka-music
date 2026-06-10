import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getApiBaseUrl } from '../constants/api';

const OFFLINE_DIR = `${FileSystem.documentDirectory}offline-tracks/`;

async function ensureOfflineDir() {
  const info = await FileSystem.getInfoAsync(OFFLINE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
  }
}

function safeExt(filename) {
  const match = filename?.match(/\.(\w+)$/);
  return match ? `.${match[1].toLowerCase()}` : '.mp3';
}

export function getOfflineTrackPath(trackId, filename) {
  return `${OFFLINE_DIR}${trackId}${safeExt(filename)}`;
}

export async function downloadTrackAudio(track) {
  if (Platform.OS === 'web') {
    throw new Error('Скачивание доступно только в приложении на телефоне');
  }

  if (!track?.filename || !track?.id) {
    throw new Error('Нет данных трека');
  }

  await ensureOfflineDir();

  const dest = getOfflineTrackPath(track.id, track.filename);
  const existing = await FileSystem.getInfoAsync(dest);
  if (existing.exists) {
    return dest;
  }

  const base = getApiBaseUrl();
  const url = `${base}/music/${encodeURIComponent(track.filename)}`;

  const result = await FileSystem.downloadAsync(url, dest);
  if (result.status !== 200) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
    throw new Error('Не удалось скачать. Запустите npm start и проверьте Wi‑Fi.');
  }

  return result.uri;
}

export async function deleteOfflineAudioFile(localUri) {
  if (!localUri) return;
  try {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch {
    // ignore
  }
}

export async function verifyOfflineFile(localUri) {
  if (!localUri) return false;
  try {
    const info = await FileSystem.getInfoAsync(localUri);
    return info.exists;
  } catch {
    return false;
  }
}
