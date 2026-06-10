import * as FileSystem from 'expo-file-system/legacy';

const ROOT = `${FileSystem.documentDirectory}my-library/`;

export const MY_LIBRARY_TRACKS_DIR = `${ROOT}tracks/`;
export const MY_LIBRARY_COVERS_DIR = `${ROOT}covers/`;
export const MY_LIBRARY_VIDEOS_DIR = `${ROOT}videos/`;

export async function ensureMyLibraryDirs() {
  for (const dir of [
    MY_LIBRARY_TRACKS_DIR,
    MY_LIBRARY_COVERS_DIR,
    MY_LIBRARY_VIDEOS_DIR,
  ]) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}
