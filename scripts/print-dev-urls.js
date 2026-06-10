const { getLanIpv4Addresses } = require('./lan-address');

const WEB_PORT = 8081;
const API_PORT = 3001;

function printDevUrls() {
  const ips = getLanIpv4Addresses();

  console.log('');
  console.log('── Телефон (Expo Go, та же Wi‑Fi) ──');
  console.log('  Сканируйте QR-код ниже в терминале (приложение Expo Go)');
  if (ips.length) {
    ips.forEach((ip) => {
      console.log(`  Или вручную в Expo Go → Enter URL: exp://${ip}:${WEB_PORT}`);
    });
  } else {
    console.log('  (Wi‑Fi IP не найден — подключите Wi‑Fi на ноутбуке)');
  }
  console.log('');
  console.log('── Браузер / админка ──');
  console.log(`  http://localhost:${WEB_PORT}`);
  if (ips.length) {
    ips.forEach((ip) => {
      console.log(`  http://${ip}:${WEB_PORT}`);
      console.log(`  API:  http://${ip}:${API_PORT}/api/health`);
    });
  }
  console.log('');
}

module.exports = { printDevUrls, WEB_PORT, API_PORT };

if (require.main === module) {
  printDevUrls();
}
