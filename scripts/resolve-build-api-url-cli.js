const {
  resolveBuildApiUrl,
  ensureEnvApiUrl,
} = require('./resolve-build-api-url');

const url = resolveBuildApiUrl();
if (!url) {
  console.error(
    'Не удалось определить EXPO_PUBLIC_API_URL. Задайте в .env вручную.'
  );
  process.exit(1);
}

ensureEnvApiUrl(url);
console.log(`EXPO_PUBLIC_API_URL=${url}`);
