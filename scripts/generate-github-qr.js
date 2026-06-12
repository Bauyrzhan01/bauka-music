const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const URL = 'https://github.com/Bauyrzhan01/bauka-music';
const PNG_PATH = path.join(ROOT, 'assets', 'github-repo-qr.png');
const HTML_PATH = path.join(ROOT, 'assets', 'github-repo-qr.html');

function fetchPng(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

function writeHtml() {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tolqyn — QR для GitHub</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: #120900;
      color: #f5f5f5;
      padding: 24px;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #1a1208;
      border: 1px solid #3d2e1a;
      border-radius: 20px;
      padding: 28px 24px;
      text-align: center;
    }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    p { color: #c9b89a; font-size: 0.9rem; line-height: 1.5; margin: 0 0 20px; }
    img {
      width: 280px;
      height: 280px;
      border-radius: 12px;
      background: #fff;
      padding: 12px;
    }
    a {
      display: inline-block;
      margin-top: 18px;
      color: #f5c76a;
      word-break: break-all;
      font-size: 0.85rem;
    }
    ol {
      text-align: left;
      color: #c9b89a;
      font-size: 0.85rem;
      line-height: 1.6;
      padding-left: 1.2rem;
      margin: 16px 0 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Tolqyn</h1>
    <p>Отсканируйте QR в Chrome на телефоне — откроется репозиторий GitHub.</p>
    <img src="./github-repo-qr.png" alt="QR код GitHub" width="280" height="280" />
    <a href="${URL}">${URL}</a>
    <ol>
      <li>Войдите в GitHub на телефоне (репозиторий приватный).</li>
      <li>Нажмите <strong>Code</strong> → <strong>Download ZIP</strong>.</li>
    </ol>
  </div>
</body>
</html>
`;
  fs.writeFileSync(HTML_PATH, html, 'utf8');
}

async function main() {
  const apiUrl =
    'https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=10&data=' +
    encodeURIComponent(URL);

  console.log('[qr] Ссылка:', URL);
  console.log('[qr] Генерация PNG…');

  const png = await fetchPng(apiUrl);
  fs.mkdirSync(path.dirname(PNG_PATH), { recursive: true });
  fs.writeFileSync(PNG_PATH, png);
  writeHtml();

  console.log('[qr] PNG:', PNG_PATH);
  console.log('[qr] HTML (откройте в Chrome):', HTML_PATH);
  console.log('');
  console.log('  file:///' + HTML_PATH.replace(/\\/g, '/'));
}

main().catch((err) => {
  console.error('[qr] Ошибка:', err.message || err);
  process.exit(1);
});
