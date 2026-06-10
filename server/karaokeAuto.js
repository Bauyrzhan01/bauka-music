const path = require('path');
const { parseFile } = require('music-metadata');
const { MUSIC_DIR, AUDIO_EXT } = require('../scripts/scan-music');
const { buildAutoLyricsTimings, parseLyricsLines } = require('../utils/autoLyricsTimings.cjs');
const { updateTrackMeta } = require('./musicCatalog');

async function getTrackDurationSec(filename) {
  const safeName = path.basename(filename);
  const ext = path.extname(safeName).toLowerCase();
  if (!AUDIO_EXT.has(ext)) {
    throw new Error('Неверный аудиофайл');
  }

  const filePath = path.join(MUSIC_DIR, safeName);
  const metadata = await parseFile(filePath, { duration: true });
  const duration = metadata.format.duration;

  if (!duration || duration <= 0) {
    throw new Error('Не удалось определить длительность трека');
  }

  return duration;
}

async function autoSyncKaraoke(filename, description, options = {}) {
  const lines = parseLyricsLines(description);
  if (!lines.length) {
    throw new Error('Добавьте текст песни (каждая строка с новой строки)');
  }

  const durationSec = await getTrackDurationSec(filename);
  const lyricsTimings = buildAutoLyricsTimings(lines, durationSec, options);

  if (lyricsTimings.length !== lines.length) {
    throw new Error('Не удалось построить метки караоке');
  }

  let saved = false;
  if (options.save) {
    await updateTrackMeta(filename, { description, lyricsTimings });
    saved = true;
  }

  return {
    lines: lines.length,
    durationSec: Math.round(durationSec * 100) / 100,
    lyricsTimings,
    saved,
  };
}

module.exports = {
  autoSyncKaraoke,
  getTrackDurationSec,
};
