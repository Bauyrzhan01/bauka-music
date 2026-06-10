import { getApiBaseUrl } from '../constants/api';

export function buildCoverUrl(coverFile) {
  if (!coverFile) return null;

  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}/uploads/covers/${encodeURIComponent(coverFile)}`;
}

export function enrichTrackWithCover(track) {
  if (!track) return track;

  const coverFile = track.coverFile ?? null;

  return {
    ...track,
    coverFile,
    coverUrl: track.coverUrl ?? buildCoverUrl(coverFile),
  };
}

export function enrichTracksWithCovers(tracks = []) {
  return tracks.map(enrichTrackWithCover);
}
