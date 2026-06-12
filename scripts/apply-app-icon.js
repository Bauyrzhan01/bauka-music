/**
 * Resize source icon into Expo asset files (icon, adaptive, splash, favicon).
 * Usage: node scripts/apply-app-icon.js [path-to-source.png]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_SOURCE = path.join(
  ROOT,
  'assets',
  'icon-source.png'
);
const ASSETS = path.join(ROOT, 'assets');

function loadSharp() {
  try {
    return require('sharp');
  } catch {
    return null;
  }
}

async function resizeWithSharp(sharpFn, source, dest, size) {
  await sharpFn(source)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(dest);
}

async function createAdaptiveForeground(sharpFn, source, dest) {
  const size = 1024;
  const logoSize = Math.round(size * 0.72);
  const logo = await sharpFn(source)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharpFn({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(dest);
}

async function main() {
  const source = path.resolve(process.argv[2] || DEFAULT_SOURCE);
  if (!fs.existsSync(source)) {
    console.error('[icon] Source not found:', source);
    process.exit(1);
  }

  if (!fs.existsSync(ASSETS)) {
    fs.mkdirSync(ASSETS, { recursive: true });
  }

  const sharp = loadSharp();
  if (!sharp) {
    console.error('[icon] Install sharp: npm i -D sharp');
    process.exit(1);
  }

  await resizeWithSharp(sharp, source, path.join(ASSETS, 'icon.png'), 1024);
  console.log('[icon] icon.png (1024x1024)');

  await createAdaptiveForeground(
    sharp,
    source,
    path.join(ASSETS, 'adaptive-icon.png')
  );
  console.log('[icon] adaptive-icon.png (1024x1024, transparent foreground)');

  for (const [name, size] of [
    ['splash-icon.png', 512],
    ['favicon.png', 48],
  ]) {
    const dest = path.join(ASSETS, name);
    await resizeWithSharp(sharp, source, dest, size);
    console.log(`[icon] ${name} (${size}x${size})`);
  }

  if (source !== DEFAULT_SOURCE) {
    fs.copyFileSync(source, DEFAULT_SOURCE);
    console.log('[icon] icon-source.png saved');
  }

  console.log('[icon] Done');
}

main().catch((error) => {
  console.error('[icon]', error.message);
  process.exit(1);
});
