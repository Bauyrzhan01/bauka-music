import { Platform } from 'react-native';
import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  ensureMyLibraryDirs,
  MY_LIBRARY_COVERS_DIR,
  MY_LIBRARY_TRACKS_DIR,
  MY_LIBRARY_VIDEOS_DIR,
} from './myLibraryPaths';

const BACKUP_VERSION = 1;

function fileExt(uri, fallback) {
  const match = String(uri || '').match(/\.(\w+)(?:\?|$)/i);
  return match ? `.${match[1].toLowerCase()}` : fallback;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readFileBase64(uri) {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function writeFileFromBase64(dest, base64) {
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return dest;
}

export async function exportLibraryZip(entries = []) {
  if (Platform.OS === 'web') {
    throw new Error('Экспорт доступен в приложении на телефоне');
  }
  if (!entries.length) {
    throw new Error('Нет треков для экспорта');
  }

  const zip = new JSZip();
  const manifestEntries = [];

  for (const entry of entries) {
    const audioExt = fileExt(entry.audioUri, '.mp3');
    const audioPath = `tracks/${entry.id}${audioExt}`;
    const audioBase64 = await readFileBase64(entry.audioUri);
    zip.file(audioPath, audioBase64, { base64: true });

    let coverPath = null;
    if (entry.coverUri) {
      const coverExt = fileExt(entry.coverUri, '.jpg');
      coverPath = `covers/${entry.id}${coverExt}`;
      const coverBase64 = await readFileBase64(entry.coverUri);
      zip.file(coverPath, coverBase64, { base64: true });
    }

    const videos = [];
    for (const video of entry.videos || []) {
      const videoExt = fileExt(video.uri, '.mp4');
      const videoPath = `videos/${entry.id}-${video.id}${videoExt}`;
      const videoBase64 = await readFileBase64(video.uri);
      zip.file(videoPath, videoBase64, { base64: true });
      videos.push({
        id: video.id,
        title: video.title,
        path: videoPath,
        createdAt: video.createdAt,
      });
    }

    manifestEntries.push({
      id: entry.id,
      title: entry.title,
      artist: entry.artist,
      description: entry.description,
      lyricsTimings: entry.lyricsTimings || [],
      clipUrl: entry.clipUrl || '',
      audioPath,
      coverPath,
      videos,
      createdAt: entry.createdAt,
    });
  }

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        entries: manifestEntries,
      },
      null,
      2
    )
  );

  const base64Zip = await zip.generateAsync({ type: 'base64' });
  const exportPath = `${FileSystem.cacheDirectory}bauka-music-backup-${Date.now()}.zip`;
  await writeFileFromBase64(exportPath, base64Zip);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(exportPath, {
      mimeType: 'application/zip',
      dialogTitle: 'Экспорт Tolqyn',
    });
  }

  return exportPath;
}

async function extractZipEntries(zip, existingIds = new Set()) {
  await ensureMyLibraryDirs();

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Неверный файл: нет manifest.json');
  }

  const manifest = JSON.parse(await manifestFile.async('string'));
  if (!manifest?.entries?.length) {
    throw new Error('Резервная копия пуста');
  }

  const imported = [];
  const now = new Date().toISOString();

  for (const item of manifest.entries) {
    let trackId = item.id;
    if (!trackId || existingIds.has(trackId)) {
      trackId = createId('lib');
    }
    existingIds.add(trackId);

    const audioZip = zip.file(item.audioPath);
    if (!audioZip) continue;

    const audioExt = fileExt(item.audioPath, '.mp3');
    const audioUri = `${MY_LIBRARY_TRACKS_DIR}${trackId}${audioExt}`;
    await writeFileFromBase64(audioUri, await audioZip.async('base64'));

    let coverUri = null;
    if (item.coverPath) {
      const coverZip = zip.file(item.coverPath);
      if (coverZip) {
        const coverExt = fileExt(item.coverPath, '.jpg');
        coverUri = `${MY_LIBRARY_COVERS_DIR}${trackId}${coverExt}`;
        await writeFileFromBase64(coverUri, await coverZip.async('base64'));
      }
    }

    const videos = [];
    for (const video of item.videos || []) {
      const videoZip = zip.file(video.path);
      if (!videoZip) continue;

      const videoId = video.id || createId('vid');
      const videoExt = fileExt(video.path, '.mp4');
      const videoUri = `${MY_LIBRARY_VIDEOS_DIR}${trackId}-${videoId}${videoExt}`;
      await writeFileFromBase64(videoUri, await videoZip.async('base64'));
      videos.push({
        id: videoId,
        title: video.title || 'Видео',
        uri: videoUri,
        createdAt: video.createdAt || now,
      });
    }

    imported.push({
      id: trackId,
      title: item.title || 'Без названия',
      artist: item.artist || 'Я',
      description: item.description || '',
      lyricsTimings: item.lyricsTimings || [],
      clipUrl: item.clipUrl || '',
      audioUri,
      coverUri,
      videos,
      createdAt: item.createdAt || now,
      updatedAt: now,
    });
  }

  return imported;
}

export async function importLibraryZipFromUri(uri, existingIds = new Set()) {
  if (Platform.OS === 'web') {
    throw new Error('Импорт доступен в приложении на телефоне');
  }

  const base64 = await readFileBase64(uri);
  const zip = await JSZip.loadAsync(base64, { base64: true });
  return extractZipEntries(zip, existingIds);
}

export async function pickAndImportLibraryZip(existingIds = new Set()) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return { ok: false, cancelled: true };
  }

  const imported = await importLibraryZipFromUri(
    result.assets[0].uri,
    existingIds
  );

  return { ok: true, entries: imported, count: imported.length };
}
