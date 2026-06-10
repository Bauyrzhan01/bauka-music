import { useCallback, useEffect, useState } from 'react';
import { useEventListener } from 'expo';
import { fitVideoInBounds } from '../utils/videoDisplayLayout';

export function useVideoFitLayout(player, maxWidth, maxHeight) {
  const [layout, setLayout] = useState(() =>
    fitVideoInBounds(0, 0, maxWidth, maxHeight)
  );

  const syncFromPlayer = useCallback(() => {
    if (!player || !maxWidth || !maxHeight) return;

    const track = player.videoTrack;
    if (track?.width && track?.height) {
      setLayout(
        fitVideoInBounds(track.width, track.height, maxWidth, maxHeight)
      );
      return;
    }

    setLayout(fitVideoInBounds(0, 0, maxWidth, maxHeight));
  }, [player, maxWidth, maxHeight]);

  useEventListener(player, 'sourceLoad', syncFromPlayer);

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      syncFromPlayer();
    }
  });

  useEffect(() => {
    syncFromPlayer();
  }, [syncFromPlayer]);

  return layout;
}
