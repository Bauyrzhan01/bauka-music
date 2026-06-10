import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

async function ensureDir(dir) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function persistImageWeb(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать фото'));
    reader.readAsDataURL(blob);
  });
}

export async function persistImage(uri, type = 'avatars') {
  if (!uri) return null;

  if (Platform.OS === 'web') {
    try {
      return await persistImageWeb(uri);
    } catch {
      return uri;
    }
  }

  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    throw new Error('Хранилище недоступно на этом устройстве');
  }

  if (uri.startsWith(docDir)) {
    return uri;
  }

  const dir = `${docDir}${type}/`;
  await ensureDir(dir);

  const extMatch = uri.match(/\.(\w+)(\?|$)/);
  const ext = extMatch?.[1] || 'jpg';
  const dest = `${dir}${Date.now()}.${ext}`;

  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
