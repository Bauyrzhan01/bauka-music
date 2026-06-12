const path = require('path');
const { getLanIpv4Addresses } = require('./lan-address');
const { copyApkFromBuild } = require('../server/appDownload');
const { writeQrAssets } = require('./qr-utils');

const ROOT = path.join(__dirname, '..');
const PORT = 3001;
const PNG_PATH = path.join(ROOT, 'assets', 'app-download-qr-wifi.png');
const HTML_PATH = path.join(ROOT, 'assets', 'app-download-qr-wifi.html');

async function main() {
  const prepared = copyApkFromBuild();
  if (!prepared.ok) {
    console.error('[qr:wifi] ' + prepared.error);
    process.exit(1);
  }

  const ips = getLanIpv4Addresses();
  if (!ips.length) {
    console.error('[qr:wifi] Wi‑Fi IP не найден. Подключите ноутбук к Wi‑Fi.');
    process.exit(1);
  }

  const url = `http://${ips[0]}:${PORT}/app`;

  await writeQrAssets({
    url,
    pngPath: PNG_PATH,
    htmlPath: HTML_PATH,
    title: 'Tolqyn — Wi‑Fi',
    subtitle:
      'QR для скачивания в той же Wi‑Fi сети. Нужен запущенный сервер: npm run server',
    steps: [
      'Телефон и ноутбук в <strong>одной Wi‑Fi</strong>.',
      'Откройте в <strong>Chrome</strong> на Android.',
      'Нажмите <strong>Скачать для Android</strong>.',
    ],
  });

  console.log('[qr:wifi] Страница:', url);
  console.log('[qr:wifi] QR PNG:', PNG_PATH);
  console.log('[qr:wifi] Сервер: npm run server');
}

main().catch((err) => {
  console.error('[qr:wifi] Ошибка:', err.message || err);
  process.exit(1);
});
