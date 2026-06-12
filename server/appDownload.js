const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const APK_NAME = 'bauka-music.apk';
const APK_PATH = path.join(DOWNLOADS_DIR, APK_NAME);
const APK_SOURCE = path.join(
  ROOT,
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk'
);
const ICON_PATH = path.join(ROOT, 'assets', 'icon.png');

function ensureDownloadsDir() {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

function copyApkFromBuild() {
  ensureDownloadsDir();

  if (!fs.existsSync(APK_SOURCE)) {
    return {
      ok: false,
      error:
        'APK не найден. Сначала соберите: npm run android:usb',
    };
  }

  fs.copyFileSync(APK_SOURCE, APK_PATH);
  const sizeMb = (fs.statSync(APK_PATH).size / (1024 * 1024)).toFixed(1);

  return { ok: true, path: APK_PATH, sizeMb };
}

function apkAvailable() {
  return fs.existsSync(APK_PATH);
}

function getApkMeta() {
  if (!apkAvailable()) return null;
  const stat = fs.statSync(APK_PATH);
  return {
    sizeMb: (stat.size / (1024 * 1024)).toFixed(1),
    updatedAt: stat.mtime.toISOString(),
  };
}

function renderDownloadPage(req, { version = '1.0.0' } = {}) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const apkUrl = `${baseUrl}/app/${APK_NAME}`;
  const iconUrl = `${baseUrl}/app/icon.png`;
  const meta = getApkMeta();
  const sizeLabel = meta ? `${meta.sizeMb} МБ` : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#120900" />
  <title>Скачать Tolqyn</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: linear-gradient(160deg, #120900 0%, #2a1808 55%, #120900 100%);
      color: #f8f4ec;
      padding: 24px 16px 40px;
    }
    .wrap { max-width: 420px; margin: 0 auto; text-align: center; }
    .icon {
      width: 96px;
      height: 96px;
      border-radius: 22px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.45);
      margin: 12px auto 16px;
    }
    h1 { font-size: 1.6rem; margin: 0 0 6px; }
    .ver { color: #c9b89a; font-size: 0.9rem; margin-bottom: 20px; }
    .card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px;
      padding: 20px 18px;
      text-align: left;
      margin-bottom: 16px;
    }
    .btn {
      display: block;
      width: 100%;
      margin-top: 14px;
      padding: 16px 20px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #f5c76a, #e8a832);
      color: #1a1208;
      font-size: 1.05rem;
      font-weight: 800;
      text-decoration: none;
      text-align: center;
    }
    .btn:active { transform: scale(0.98); }
    .hint { color: #c9b89a; font-size: 0.85rem; line-height: 1.55; margin: 0; }
    ol { margin: 10px 0 0; padding-left: 1.2rem; color: #ddd; font-size: 0.85rem; line-height: 1.6; }
    .ios {
      margin-top: 14px;
      padding: 14px;
      border-radius: 12px;
      background: rgba(0,0,0,0.25);
      color: #c9b89a;
      font-size: 0.82rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <img class="icon" src="${iconUrl}" alt="Tolqyn" width="96" height="96" />
    <h1>Tolqyn</h1>
    <p class="ver">Версия ${version}${sizeLabel ? ` · ${sizeLabel}` : ''}</p>

    <div class="card">
      <p class="hint">Музыкальный плеер с караоке, рилсами и своей библиотекой.</p>
      <a class="btn" href="${apkUrl}" download="${APK_NAME}">
        Скачать для Android
      </a>
      <ol>
        <li>Откройте ссылку в <strong>Chrome</strong>.</li>
        <li>После скачивания откройте APK и разрешите установку.</li>
        <li>Если браузер блокирует — Настройки → Безопасность → неизвестные источники для Chrome.</li>
      </ol>
    </div>

    <div class="ios">
      <strong>iPhone:</strong> установка через App Store пока недоступна. Используйте Android или сборку через Apple Developer.
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  APK_NAME,
  APK_PATH,
  APK_SOURCE,
  ICON_PATH,
  DOWNLOADS_DIR,
  ensureDownloadsDir,
  copyApkFromBuild,
  apkAvailable,
  getApkMeta,
  renderDownloadPage,
};
