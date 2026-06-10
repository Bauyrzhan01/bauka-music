const { spawnSync } = require('child_process');
const path = require('path');
const {
  resolveBuildApiUrl,
  ensureEnvApiUrl,
} = require('./resolve-build-api-url');

const ROOT = path.join(__dirname, '..');

function run(command, args, extraEnv = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
}

function main() {
  const apiUrl = resolveBuildApiUrl();
  if (!apiUrl) {
    console.error(
      '[apk] Не найден IP. Подключите Wi‑Fi и добавьте в .env:\n' +
        '  EXPO_PUBLIC_API_URL=http://192.168.x.x:3001'
    );
    process.exit(1);
  }

  ensureEnvApiUrl(apiUrl);
  console.log(`[apk] API для сборки: ${apiUrl}`);
  console.log('[apk] Сервер должен быть доступен с телефона по этому адресу.\n');

  const envArgs = [
    'eas-cli',
    'env:create',
    '--name',
    'EXPO_PUBLIC_API_URL',
    '--value',
    apiUrl,
    '--environment',
    'preview',
    '--visibility',
    'plaintext',
    '--force',
    '--non-interactive',
  ];

  console.log('[apk] Обновляем переменную на Expo (preview)...');
  run('npx', envArgs);

  console.log('\n[apk] Запуск облачной сборки APK (preview)...\n');
  const build = run('npx', [
    'eas-cli',
    'build',
    '-p',
    'android',
    '--profile',
    'preview',
    '--non-interactive',
  ]);

  process.exit(build.status ?? 1);
}

main();
