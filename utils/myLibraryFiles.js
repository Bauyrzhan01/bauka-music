import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ensureMyLibraryDirs,
  MY_LIBRARY_COVERS_DIR,
  MY_LIBRARY_TRACKS_DIR,
  MY_LIBRARY_VIDEOS_DIR,
} from './myLibraryPaths';

function safeExt(filename, fallback = '.mp3') {
  const match = filename?.match(/\.(\w+)$/i);
  return match ? `.${match[1].toLowerCase()}` : fallback;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function titleFromFileName(name) {
  const base = String(name || '')
    .replace(/\.[^.]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return 'Без названия';
  return base.replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function importAudioToLibrary(sourceUri, originalName) {
  if (Platform.OS === 'web') {
    throw new Error('Добавление музыки доступно в приложении на телефоне');
  }

  await ensureMyLibraryDirs();

  const trackId = createId('lib');
  const ext = safeExt(originalName, '.mp3');
  const dest = `${MY_LIBRARY_TRACKS_DIR}${trackId}${ext}`;

  await FileSystem.copyAsync({ from: sourceUri, to: dest });

  return {
    trackId,
    audioUri: dest,
    title: titleFromFileName(originalName),
  };
}

export async function importVideoToLibrary(sourceUri, originalName, trackId) {
  if (Platform.OS === 'web') {
    throw new Error('Добавление видео доступно в приложении на телефоне');
  }

  await ensureMyLibraryDirs();

  const videoId = createId('vid');
  const ext = safeExt(originalName, '.mp4');
  const dest = `${MY_LIBRARY_VIDEOS_DIR}${trackId}-${videoId}${ext}`;

  await FileSystem.copyAsync({ from: sourceUri, to: dest });

  return { videoId, uri: dest };
}

export async function importCoverToLibrary(sourceUri, trackId) {
  if (Platform.OS === 'web') {
    return sourceUri;
  }

  await ensureMyLibraryDirs();

  const ext = safeExt(sourceUri, '.jpg');
  const dest = `${MY_LIBRARY_COVERS_DIR}${trackId}${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function deleteLibraryFile(uri) {
  if (!uri || Platform.OS === 'web') return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

export async function verifyLibraryFile(uri) {
  if (!uri) return false;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}
