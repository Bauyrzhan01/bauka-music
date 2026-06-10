function buildAutoLyricsTimings(lines, durationSec, options = {}) {
  const count = lines?.length ?? 0;
  if (!count || !durationSec || durationSec <= 0) {
    return [];
  }

  const intro =
    options.introSeconds ?? Math.min(8, Math.max(2, durationSec * 0.06));
  const outro = options.outroSeconds ?? 2;
  const minGap = options.minGapSeconds ?? 0.4;

  const usable = Math.max(durationSec - intro - outro, count * minGap);
  const weights = lines.map((line) =>
    Math.max(String(line).replace(/\s/g, '').length, 6)
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;

  const timings = [];
  let cursor = intro;

  for (let i = 0; i < count; i += 1) {
    timings.push(Math.round(cursor * 100) / 100);
    const share = (weights[i] / totalWeight) * usable;
    cursor += Math.max(share, minGap);
  }

  const maxStart = durationSec - outro - minGap;
  if (timings[timings.length - 1] > maxStart) {
    const span = timings[timings.length - 1] - intro || 1;
    const scale = (maxStart - intro) / span;
    return timings.map((time, index) => {
      if (index === 0) return Math.round(intro * 100) / 100;
      return Math.round((intro + (time - intro) * scale) * 100) / 100;
    });
  }

  return timings;
}

function parseLyricsLines(text) {
  if (!text?.trim()) return [];
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

module.exports = {
  buildAutoLyricsTimings,
  parseLyricsLines,
};
