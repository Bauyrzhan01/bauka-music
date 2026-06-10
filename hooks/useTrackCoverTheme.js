import { useEffect, useState } from 'react';
import getImageAccentColor from '../utils/getImageAccentColor';
import {
  buildPlayerTheme,
  DEFAULT_PLAYER_THEME,
} from '../utils/playerThemeFromCover';

export function useTrackCoverTheme(coverUrl) {
  const [theme, setTheme] = useState(DEFAULT_PLAYER_THEME);

  useEffect(() => {
    if (!coverUrl) {
      setTheme(DEFAULT_PLAYER_THEME);
      return undefined;
    }

    let cancelled = false;
    setTheme(DEFAULT_PLAYER_THEME);

    getImageAccentColor(coverUrl).then((accent) => {
      if (cancelled) return;
      setTheme(buildPlayerTheme(accent));
    });

    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  return theme;
}
