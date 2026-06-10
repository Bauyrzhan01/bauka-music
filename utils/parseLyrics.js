export function parseLyrics(text) {
  if (!text?.trim()) return [];

  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getActiveLyricIndex(
  lines,
  positionMillis,
  durationMillis,
  lyricsTimings
) {
  if (!lines.length) return 0;

  const timings = lyricsTimings?.filter(
    (value) => typeof value === 'number' && !Number.isNaN(value)
  );

  if (timings?.length === lines.length) {
    const positionSec = positionMillis / 1000;
    let index = 0;

    for (let i = 0; i < timings.length; i += 1) {
      if (positionSec >= timings[i]) {
        index = i;
      } else {
        break;
      }
    }

    return index;
  }

  if (!durationMillis) return 0;

  const ratio = Math.max(0, Math.min(positionMillis / durationMillis, 1));
  const index = Math.floor(ratio * lines.length);

  return Math.min(lines.length - 1, Math.max(0, index));
}

export function formatLyricTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}
