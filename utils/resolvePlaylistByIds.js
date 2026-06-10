import { getCatalogTracks } from './catalogTrackRegistry';

export function resolvePlaylistByIds(ids) {
  const catalog = getCatalogTracks();
  if (!ids?.length) return [...catalog];
  const byId = Object.fromEntries(catalog.map((track) => [track.id, track]));
  const resolved = ids.map((id) => byId[id]).filter(Boolean);
  if (!resolved.length) return [...catalog];

  const used = new Set(resolved.map((t) => t.id));
  const rest = catalog.filter((t) => !used.has(t.id));
  return [...resolved, ...rest];
}

export function findTrackById(trackId) {
  return getCatalogTracks().find((track) => track.id === trackId) ?? null;
}
