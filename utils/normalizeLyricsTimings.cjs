function normalizeLyricsTimings(raw, lineCount, durationSec) {
  if (!Array.isArray(raw) || raw.length !== lineCount) {
    throw new Error(
      `ИИ вернул ${raw?.length ?? 0} меток, нужно ${lineCount}`
    );
  }

  const timings = raw.map((value, index) => {
    const seconds = Number(value);
    if (Number.isNaN(seconds) || seconds < 0) {
      throw new Error(`Неверное время для строки ${index + 1}`);
    }
    return Math.round(seconds * 100) / 100;
  });

  timings.forEach((seconds, index) => {
    if (index > 0 && seconds < timings[index - 1]) {
      timings[index] = timings[index - 1];
    }
  });

  if (durationSec > 0) {
    const maxStart = Math.max(0, durationSec - 0.5);
    for (let i = timings.length - 1; i >= 0; i -= 1) {
      if (timings[i] > maxStart) {
        timings[i] = i > 0 ? timings[i - 1] : 0;
      }
    }
  }

  return timings;
}

module.exports = { normalizeLyricsTimings };
