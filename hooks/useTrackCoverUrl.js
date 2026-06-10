import { useMemo } from 'react';
import { useMusicCatalog } from '../context/MusicCatalogContext';
import { enrichTrackWithCover } from '../utils/trackCoverUrl';

export function useTrackCoverUrl(track) {
  const { tracks } = useMusicCatalog();

  return useMemo(() => {
    if (!track) return null;

    const fromCatalog = tracks.find(
      (item) => item.id === track.id || item.filename === track.filename
    );

    return enrichTrackWithCover({
      ...track,
      coverFile: track.coverFile ?? fromCatalog?.coverFile ?? null,
      coverUrl: track.coverUrl ?? fromCatalog?.coverUrl ?? null,
    }).coverUrl;
  }, [track, tracks]);
}
