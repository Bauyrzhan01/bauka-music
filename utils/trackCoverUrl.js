import { Image } from 'react-native';
import { getApiBaseUrl } from '../constants/api';

export function buildCoverUrl(coverFile) {
  if (!coverFile) return null;

  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}/uploads/covers/${encodeURIComponent(coverFile)}`;
}

function resolveBundledCover(track) {
  if (track.cover == null) return null;
  return Image.resolveAssetSource(track.cover)?.uri ?? null;
}

export function enrichTrackWithCover(track) {
  if (!track) return track;

  const coverFile = track.coverFile ?? null;
  const bundledCoverUrl = resolveBundledCover(track);
  const coverUrl =
    track.coverUrl ?? bundledCoverUrl ?? buildCoverUrl(coverFile);

  return {
    ...track,
    coverFile,
    coverUrl,
  };
}

export function enrichTracksWithCovers(tracks = []) {
  return tracks.map(enrichTrackWithCover);
}
