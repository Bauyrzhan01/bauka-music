import { buildAutoLyricsTimings, parseLyricsLines } from './autoLyricsTimings';
import { getAudioDurationSec } from './getAudioDurationSec';

export async function autoSyncKaraokeLocal(audioUri, description) {
  const lines = parseLyricsLines(description);
  if (!lines.length) {
    throw new Error('Добавьте текст песни (каждая строка с новой строки)');
  }

  const durationSec = await getAudioDurationSec(audioUri);
  const lyricsTimings = buildAutoLyricsTimings(lines, durationSec);

  if (lyricsTimings.length !== lines.length) {
    throw new Error('Не удалось построить метки караоке');
  }

  return {
    lines: lines.length,
    durationSec: Math.round(durationSec * 100) / 100,
    lyricsTimings,
  };
}
