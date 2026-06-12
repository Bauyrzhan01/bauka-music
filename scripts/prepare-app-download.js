const { copyApkFromBuild } = require('../server/appDownload');

function main() {
  const result = copyApkFromBuild();
  if (!result.ok) {
    console.error('[app] ' + result.error);
    process.exit(1);
  }
  console.log(`[app] APK готов: ${result.path} (${result.sizeMb} МБ)`);
}

main();
