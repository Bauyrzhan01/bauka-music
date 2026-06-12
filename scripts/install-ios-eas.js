const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function run(command, args, inherit = true) {
  return spawnSync(command, args, {
    cwd: ROOT,
    stdio: inherit ? 'inherit' : 'pipe',
    shell: true,
    encoding: inherit ? undefined : 'utf8',
  });
}

function main() {
  console.log('[ios] Tolqyn — установка на iPhone\n');
  console.log('  На Windows нет Xcode — сборка идёт в облаке Expo (EAS).');
  console.log('  Нужны: аккаунт Expo и Apple Developer ($99/год).\n');

  const whoami = run('npx', ['eas', 'whoami'], false);
  if (whoami.status !== 0) {
    console.error('[ios] Вы не вошли в Expo.');
    console.error('  Выполните в терминале: npx eas login');
    console.error('  Затем снова: npm run ios:eas\n');
    process.exit(1);
  }

  const email = (whoami.stdout || '').trim();
  if (email) {
    console.log(`  Аккаунт Expo: ${email}\n`);
  }

  console.log('[ios] Если iPhone ещё не зарегистрирован в Expo:');
  console.log('  npx eas device:create');
  console.log('  (откроется страница — установите профиль на iPhone)\n');

  console.log('[ios] Запуск облачной сборки (preview, internal)…');
  console.log('  Первая сборка обычно 15–25 мин.\n');

  const build = run('npx', [
    'eas',
    'build',
    '--platform',
    'ios',
    '--profile',
    'preview',
  ]);

  if (build.status !== 0) {
    console.error('\n[ios] Сборка не удалась.');
    console.error('  Проверьте Apple Developer и сертификаты: npx eas credentials');
    process.exit(build.status ?? 1);
  }

  console.log('\n[ios] Готово.');
  console.log('  Откройте ссылку из вывода выше на iPhone (Safari) → Установить.');
  console.log('  Или: npx eas build:list → Install на нужной сборке.\n');
}

main();
