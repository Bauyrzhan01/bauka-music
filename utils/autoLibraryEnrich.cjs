function parseLyricsLines(text) {
  if (!text?.trim()) return [];
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function lyricsNeedAutoSync(description, lyricsTimings = []) {
  const lines = parseLyricsLines(description);
  if (!lines.length) return false;
  if (!lyricsTimings?.length) return true;
  if (lyricsTimings.length !== lines.length) return true;
  return !lyricsTimings.every((value) => typeof value === 'number');
}

module.exports = {
  lyricsNeedAutoSync,
};
