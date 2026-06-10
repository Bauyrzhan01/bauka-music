import { getCatalogTracks } from './catalogTrackRegistry';

export function getFavoriteTracks(favoriteIds) {
  if (!favoriteIds?.length) return [];

  const byId = Object.fromEntries(
    getCatalogTracks().map((track) => [track.id, track])
  );

  return favoriteIds.map((id) => byId[id]).filter(Boolean);
}
