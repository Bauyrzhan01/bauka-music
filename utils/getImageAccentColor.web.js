import { rgbToHex } from './colorUtils';

const DEFAULT_COLOR = '#333333';

function parseRgb(color) {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
}

export default async function getImageAccentColor(uri) {
  if (!uri) return DEFAULT_COLOR;

  try {
    const rgb = await new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 40;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

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

        if (!count) {
          reject(new Error('empty image'));
          return;
        }

        resolve(
          `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`,
        );
      };
      img.onerror = reject;
      img.src = uri;
    });

    const parsed = parseRgb(rgb);
    return parsed ? rgbToHex(parsed) : DEFAULT_COLOR;
  } catch {
    return DEFAULT_COLOR;
  }
}
