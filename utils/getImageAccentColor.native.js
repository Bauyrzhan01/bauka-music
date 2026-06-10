import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { rgbToHex } from './colorUtils';

const DEFAULT_COLOR = '#333333';
const SAMPLE_SIZE = 16;

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function averageColorFromJpeg(bytes) {
  const { data } = jpeg.decode(bytes, { useTArray: true });
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }

  if (!count) return null;

  return rgbToHex({
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  });
}

export default async function getImageAccentColor(uri) {
  if (!uri) return DEFAULT_COLOR;

  try {
    const sample = await manipulateAsync(
      uri,
      [{ resize: { width: SAMPLE_SIZE, height: SAMPLE_SIZE } }],
      {
        compress: 0.85,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!sample.base64) return DEFAULT_COLOR;

    const color = averageColorFromJpeg(base64ToBytes(sample.base64));
    return color || DEFAULT_COLOR;
  } catch {
    return DEFAULT_COLOR;
  }
}
