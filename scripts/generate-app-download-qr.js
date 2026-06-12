const fs = require('fs');
const path = require('path');
const { resolveBuildApiUrl } = require('./resolve-build-api-url');
const { copyApkFromBuild } = require('../server/appDownload');
const { writeQrAssets } = require('./qr-utils');

const ROOT = path.join(__dirname, '..');
const PNG_PATH = path.join(ROOT, 'assets', 'app-download-qr.png');
const HTML_PATH = path.join(ROOT, 'assets', 'app-download-qr.html');

function resolveDownloadPageUrl() {
  const fromEnv =
    process.env.PUBLIC_APP_URL ||
    process.env.APP_DOWNLOAD_URL ||
    process.env.EXPO_PUBLIC_API_URL;

  if (fromEnv) {
    return `${fromEnv.replace(/\/$/, '')}/app`;
  }

  const api = resolveBuildApiUrl();
  if (api) {
    return `${api}/app`;
  }

  return null;
}

async function main() {
  const prepared = copyApkFromBuild();
  if (!prepared.ok) {
    console.error('[qr:app] ' + prepared.error);
    process.exit(1);
  }

  const url = resolveDownloadPageUrl();
  if (!url) {
    console.error(
      '[qr:app] Не найден URL. Добавьте в .env:\n' +
        '  PUBLIC_APP_URL=https://ваш-публичный-адрес\n' +
        'Или запустите: npm run app:share'
    );
    process.exit(1);
  }

  await writeQrAssets({
    url,
    pngPath: PNG_PATH,
    htmlPath: HTML_PATH,
    title: 'Tolqyn',
    subtitle: 'Отсканируйте QR в Chrome на телефоне — откроется страница скачивания приложения.',
    steps: [
      'Откройте ссылку в <strong>Chrome</strong> (Android).',
      'Нажмите <strong>Скачать для Android</strong>.',
      'Установите APK и разрешите установку из Chrome.',
    ],
  });

  console.log('[qr:app] Страница скачивания:', url);
  console.log('[qr:app] APK:', prepared.path, `(${prepared.sizeMb} МБ)`);
  console.log('[qr:app] QR PNG:', PNG_PATH);
  console.log('[qr:app] QR HTML:', HTML_PATH);
  console.log('');
  console.log('  Сервер должен быть запущен: npm run server');
  console.log('  Для интернета (любой пользователь): npm run app:share');
}

main().catch((err) => {
  console.error('[qr:app] Ошибка:', err.message || err);
  process.exit(1);
});
