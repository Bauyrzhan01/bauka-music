const fs = require('fs');
const https = require('https');

function fetchQrPng(text, size = 512) {
  const url =
    'https://api.qrserver.com/v1/create-qr-code/?size=' +
    `${size}x${size}&margin=12&data=` +
    encodeURIComponent(text);

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`QR API HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function writeQrAssets({ url, pngPath, htmlPath, title, subtitle, steps }) {
  const png = await fetchQrPng(url);
  fs.mkdirSync(require('path').dirname(pngPath), { recursive: true });
  fs.writeFileSync(pngPath, png);

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif; background: #120900; color: #f5f5f5; padding: 24px;
    }
    .card {
      max-width: 420px; width: 100%; background: #1a1208; border: 1px solid #3d2e1a;
      border-radius: 20px; padding: 28px 24px; text-align: center;
    }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    p { color: #c9b89a; font-size: 0.9rem; line-height: 1.5; margin: 0 0 20px; }
    img { width: 280px; height: 280px; border-radius: 12px; background: #fff; padding: 12px; }
    a { display: inline-block; margin-top: 18px; color: #f5c76a; word-break: break-all; font-size: 0.85rem; }
    ol { text-align: left; color: #c9b89a; font-size: 0.85rem; line-height: 1.6; padding-left: 1.2rem; margin: 16px 0 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${subtitle}</p>
    <img src="./${require('path').basename(pngPath)}" alt="QR код" width="280" height="280" />
    <a href="${url}">${url}</a>
    <ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html, 'utf8');
}

module.exports = { fetchQrPng, writeQrAssets };
