export function getTracksByIds(trackIds, catalogTracks = []) {
  if (!trackIds?.length) return [];

  const byId = Object.fromEntries(catalogTracks.map((track) => [track.id, track]));

  return trackIds.map((id) => byId[id]).filter(Boolean);
}
