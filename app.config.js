const base = require('./app.json');

const apiUrl = process.env.EXPO_PUBLIC_API_URL || null;

module.exports = {
  expo: {
    ...base.expo,
    name: 'Bauka Music',
    extra: {
      ...base.expo.extra,
      apiUrl,
    },
    android: {
      ...base.expo.android,
      package: 'com.baukamusic.app',
      versionCode: 3,
      usesCleartextTraffic: true,
    },
    ios: {
      ...base.expo.ios,
      bundleIdentifier: 'com.baukamusic.app',
    },
  },
};
