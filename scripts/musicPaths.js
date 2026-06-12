const path = require('path');

/** Встроенный каталог — файлы из этой папки вшиваются в APK */
const MUSIC_DIR = path.join(__dirname, '..', 'music');
const AUDIO_EXT = new Set(['.mp3', '.m4a', '.wav', '.aac']);

module.exports = { MUSIC_DIR, AUDIO_EXT };
