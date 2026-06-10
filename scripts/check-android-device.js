const {
  getAdbPath,
  listUsbDevices,
  requireAndroidSdk,
} = require('./android-env');

function main() {
  const androidHome = requireAndroidSdk();
  const adbPath = getAdbPath(androidHome);
  const devices = listUsbDevices(adbPath);

  console.log('[android] SDK:', androidHome);
  console.log('[android] ADB:', adbPath);
  console.log('');

  if (devices.length === 0) {
    console.log('Устройств не найдено. Подключите телефон по USB.');
    process.exit(1);
  }

  devices.forEach((d) => {
    const ok = d.state === 'device' ? 'готов' : d.state;
    console.log(`  ${d.model} (${d.serial}) — ${ok}`);
  });

  const ready = devices.filter((d) => d.state === 'device');
  process.exit(ready.length > 0 ? 0 : 1);
}

main();
