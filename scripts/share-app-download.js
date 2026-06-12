const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { copyApkFromBuild } = require('../server/appDownload');
const { writeQrAssets } = require('./qr-utils');

const ROOT = path.join(__dirname, '..');
const PORT = 3001;
const PNG_PATH = path.join(ROOT, 'assets', 'app-download-qr.png');
const HTML_PATH = path.join(ROOT, 'assets', 'app-download-qr.html');

function waitForHealth(timeoutMs = 45000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on('error', retry);
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Сервер не ответил на порту ' + PORT));
        return;
      }
      setTimeout(tick, 500);
    };

    tick();
  });
}

function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startServer() {
  return spawn('node', [path.join(__dirname, 'start-server.js')], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    shell: true,
  });
}

function startTunnel() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'npx',
      ['cloudflared', 'tunnel', '--url', `http://127.0.0.1:${PORT}`],
      { cwd: ROOT, shell: true }
    );

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        proc.kill();
        reject(new Error('Туннель не поднялся за 60 сек'));
      }
    }, 60000);

    const onData = (chunk) => {
      const text = String(chunk);
      process.stdout.write(text);
      const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match && !resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ proc, url: match[0] });
      }
    };

    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (code) => {
      if (!resolved) {
        clearTimeout(timer);
        reject(new Error('cloudflared завершился с кодом ' + code));
      }
    });
  });
}

async function main() {
  console.log('[app:share] Tolqyn — публичная ссылка для скачивания\n');

  const prepared = copyApkFromBuild();
  if (!prepared.ok) {
    console.error('[app:share] ' + prepared.error);
    process.exit(1);
  }
  console.log(`[app:share] APK: ${prepared.sizeMb} МБ\n`);

  if (!(await isServerUp())) {
    console.log('[app:share] Запуск сервера…');
    startServer().unref();
    await waitForHealth();
  } else {
    console.log('[app:share] Сервер уже работает на порту', PORT);
  }

  console.log('[app:share] Поднимаем публичный туннель (cloudflared)…\n');
  const { proc: tunnelProc, url: tunnelBase } = await startTunnel();
  const pageUrl = `${tunnelBase}/app`;

  const { getLanIpv4Addresses } = require('./lan-address');
  const lanIps = getLanIpv4Addresses();
  const wifiUrl = lanIps[0] ? `http://${lanIps[0]}:${PORT}/app` : null;

  await writeQrAssets({
    url: pageUrl,
    pngPath: PNG_PATH,
    htmlPath: HTML_PATH,
    title: 'Tolqyn — скачать',
    subtitle:
      'Любой пользователь может отсканировать QR и скачать приложение в Chrome.',
    steps: [
      'Откройте в <strong>Chrome</strong> на Android.',
      'Нажмите <strong>Скачать для Android</strong>.',
      'Установите APK.',
    ],
  });

  const urlInfo = {
    publicUrl: pageUrl,
    wifiUrl,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(ROOT, 'assets', 'current-download-url.json'),
    JSON.stringify(urlInfo, null, 2),
    'utf8'
  );

  console.log('\n[app:share] Готово!\n');
  console.log('  Публичная: ' + pageUrl);
  if (wifiUrl) {
    console.log('  Wi‑Fi (быстрее рядом): ' + wifiUrl);
  }
  console.log('  QR PNG:    ' + PNG_PATH);
  console.log('  QR HTML:   ' + HTML_PATH);
  console.log('\n  Оставьте этот терминал открытым — пока он работает, ссылка активна.');
  console.log('  Ctrl+C — остановить туннель.\n');

  const shutdown = () => {
    try {
      tunnelProc.kill();
    } catch {
      // ignore
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[app:share] Ошибка:', err.message || err);
  process.exit(1);
});
