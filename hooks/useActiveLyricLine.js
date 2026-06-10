import { useMemo } from 'react';
import { getActiveLyricIndex, parseLyrics } from '../utils/parseLyrics';

export function useActiveLyricLine(
  lyricsText,
  positionMillis,
  durationMillis,
  lyricsTimings
) {
  const lines = useMemo(() => parseLyrics(lyricsText), [lyricsText]);

  const hasSync =
    lyricsTimings?.length === lines.length &&
    lyricsTimings.every((value) => typeof value === 'number');

  const activeIndex = useMemo(
    () =>
      getActiveLyricIndex(
        lines,
        positionMillis,
        durationMillis,
        hasSync ? lyricsTimings : null
      ),
    [lines, positionMillis, durationMillis, lyricsTimings, hasSync]
  );

  const activeLine = lines[activeIndex] ?? '';

  return {
    lines,
    activeIndex,
    activeLine,
    hasLyrics: lines.length > 0,
    hasSync,
  };
}
