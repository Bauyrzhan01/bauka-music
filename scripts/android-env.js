const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const IS_WIN = process.platform === 'win32';

function getAndroidHome() {
  if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }

  const candidates = [
    process.env.ANDROID_SDK_ROOT,
    IS_WIN && process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
      : null,
    path.join(os.homedir(), 'Library', 'Android', 'sdk'),
    path.join(os.homedir(), 'Android', 'Sdk'),
  ].filter(Boolean);

  return candidates.find((dir) => fs.existsSync(dir)) || null;
}

function getAdbPath(androidHome) {
  const adbName = IS_WIN ? 'adb.exe' : 'adb';
  if (androidHome) {
    const sdkAdb = path.join(androidHome, 'platform-tools', adbName);
    if (fs.existsSync(sdkAdb)) return sdkAdb;
  }
  return adbName;
}

function withAndroidEnv(androidHome) {
  const extra = [
    path.join(androidHome, 'platform-tools'),
    path.join(androidHome, 'emulator'),
    path.join(androidHome, 'cmdline-tools', 'latest', 'bin'),
  ];

  return {
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    PATH: [...extra, process.env.PATH || ''].join(path.delimiter),
  };
}

function run(command, args, extraEnv = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: IS_WIN,
    env: { ...process.env, ...extraEnv },
  });
}

function adbOutput(adbPath, args, extraEnv = {}) {
  return spawnSync(adbPath, args, {
    encoding: 'utf8',
    shell: IS_WIN,
    env: { ...process.env, ...extraEnv },
  });
}

function listUsbDevices(adbPath) {
  const result = adbOutput(adbPath, ['devices', '-l']);
  const stdout = result.stdout || '';
  const lines = stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const [serial, state, ...rest] = line.split(/\s+/);
    const details = rest.join(' ');
    const modelMatch = details.match(/model:(\S+)/);
    return {
      serial,
      state,
      model: modelMatch ? modelMatch[1] : serial,
    };
  });
}

function requireUsbDevice(adbPath) {
  const devices = listUsbDevices(adbPath);
  const ready = devices.filter((d) => d.state === 'device');
  const unauthorized = devices.filter((d) => d.state === 'unauthorized');

  if (ready.length === 0) {
    console.error('[android] Телефон по USB не найден.\n');
    console.error('Проверьте:');
    console.error('  1. Кабель подключён (режим передачи файлов / отладка)');
    console.error('  2. На телефоне включена «Отладка по USB»');
    console.error('  3. На экране телефона нажато «Разрешить отладку»');
    if (unauthorized.length > 0) {
      console.error('\nСейчас устройство unauthorized — подтвердите запрос на телефоне.');
    }
    process.exit(1);
  }

  return ready[0];
}

function requireAndroidSdk() {
  const androidHome = getAndroidHome();
  if (!androidHome) {
    console.error('[android] Android SDK не найден.');
    console.error('Установите Android Studio и SDK (Android SDK Platform + Build-Tools).');
    process.exit(1);
  }
  return androidHome;
}

module.exports = {
  ROOT,
  IS_WIN,
  getAndroidHome,
  getAdbPath,
  withAndroidEnv,
  run,
  listUsbDevices,
  requireUsbDevice,
  requireAndroidSdk,
};
