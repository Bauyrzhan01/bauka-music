import { LOCAL_TRACKS } from '../data/localTracks';
import { getSimilarTracks } from './getSimilarTracks';

function shuffle(array) {
  const list = [...array];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function interleave(buckets) {
  const result = [];
  const lists = buckets.filter((b) => b.length);
  let index = 0;
  let added = true;

  while (added) {
    added = false;
    for (let i = 0; i < lists.length; i += 1) {
      const list = lists[i];
      if (index < list.length) {
        result.push(list[index]);
        added = true;
      }
    }
    index += 1;
  }

  return result;
}

function dedupeTracks(tracks) {
  const seen = new Set();
  return tracks.filter((track) => {
    if (!track?.id || seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });
}

export function buildMyWavePlaylist({
  favoriteIds = [],
  recentIds = [],
  catalogTracks = LOCAL_TRACKS,
  seedTrackId = null,
} = {}) {
  const pool = catalogTracks.length ? catalogTracks : LOCAL_TRACKS;
  const favoriteSet = new Set(favoriteIds);
  const byId = Object.fromEntries(pool.map((track) => [track.id, track]));
  const seedTrack = seedTrackId ? byId[seedTrackId] : null;

  const favorites = shuffle(pool.filter((track) => favoriteSet.has(track.id))).slice(
    0,
    24
  );

  const similar = seedTrack
    ? shuffle(getSimilarTracks(seedTrack, pool, 16))
    : [];

  const recent = shuffle(
    recentIds
      .map((id) => byId[id])
      .filter(Boolean)
      .filter((track) => !favoriteSet.has(track.id))
  ).slice(0, 16);

  const used = new Set([
    ...favorites.map((t) => t.id),
    ...similar.map((t) => t.id),
    ...recent.map((t) => t.id),
  ]);

  const discovery = shuffle(pool.filter((track) => !used.has(track.id))).slice(
    0,
    20
  );

  const mixed = interleave([favorites, similar, recent, discovery]);
  return dedupeTracks(mixed.length ? mixed : shuffle(pool));
}

export function getMyWaveSubtitle({
  favoriteIds = [],
  recentIds = [],
  seedTrackId = null,
} = {}) {
  const parts = [];
  if (favoriteIds.length > 0) parts.push('избранное');
  if (recentIds.length > 0) parts.push('недавние');
  if (seedTrackId) parts.push('похожие');
  if (!parts.length) return null;
  return `Микс: ${parts.join(' + ')}`;
}
