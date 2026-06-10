import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import jpeg from 'jpeg-js';

const PALETTE = [
  '#4f46e5',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#be185d',
  '#0d9488',
];

export function getAccentColorFromLabel(label) {
  const text = String(label || 'bauka').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function hexToRgb(hex) {
  const value = parseInt(hex.replace('#', ''), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function bytesToBase64(bytes) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += chars[(triplet >> 18) & 63];
    result += chars[(triplet >> 12) & 63];
    result += i + 1 < len ? chars[(triplet >> 6) & 63] : '=';
    result += i + 2 < len ? chars[triplet & 63] : '=';
  }

  return result;
}

async function ensureDir(dir) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function generatePlaceholderImageFile(
  label,
  { width = 128, height = 128, subdir = 'covers' } = {}
) {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) return null;

    const color = getAccentColorFromLabel(label);
    const { r, g, b } = hexToRgb(color);
    const data = new Uint8Array(width * height * 4);

    for (let i = 0; i < width * height; i += 1) {
      const offset = i * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }

    const encoded = jpeg.encode({ data, width, height }, 80);
    const dir = `${docDir}${subdir}/`;
    await ensureDir(dir);

    const dest = `${dir}auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    await FileSystem.writeAsStringAsync(dest, bytesToBase64(encoded.data), {
      encoding: FileSystem.EncodingType.Base64,
    });

    return dest;
  } catch {
    return null;
  }
}
