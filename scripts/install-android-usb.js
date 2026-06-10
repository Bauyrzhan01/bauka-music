const {
  getAdbPath,
  withAndroidEnv,
  run,
  requireUsbDevice,
  requireAndroidSdk,
} = require('./android-env');

function main() {
  const debug = process.argv.includes('--debug');
  const variant = debug ? 'debug' : 'release';

  const androidHome = requireAndroidSdk();
  const env = withAndroidEnv(androidHome);
  const adbPath = getAdbPath(androidHome);
  const device = requireUsbDevice(adbPath);

  console.log('[android] Bauka Music — установка по USB\n');
  console.log(`  Устройство: ${device.model} (${device.serial})`);
  console.log(`  Вариант:    ${variant}`);
  if (variant === 'release') {
    console.log('  Режим:      автономный (без Metro на ПК)');
  } else {
    console.log('  Режим:      разработка (нужен npm start на ПК)');
  }
  console.log('\nПервая сборка обычно 10–20 мин (Gradle + зависимости).');
  console.log('Повторные — 2–5 мин.\n');

  const args = [
    'expo',
    'run:android',
    '--device',
    device.model,
    '--variant',
    variant,
  ];

  if (variant === 'release') {
    args.push('--no-bundler');
  }

  const result = run('npx', args, env);
  if (result.status !== 0) {
    console.error('\n[android] Сборка не удалась.');
    console.error('Частые причины: оборвалось скачивание Gradle, отключился USB, мало места.');
    console.error('Просто запустите команду ещё раз: npm run android:usb');
    process.exit(result.status ?? 1);
  }

  console.log('\n[android] Готово — приложение установлено на телефон.');
}

main();
