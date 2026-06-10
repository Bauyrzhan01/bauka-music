function normalizeArtist(name) {
  return String(name || '').trim().toLowerCase();
}

function resolveAuthorId(track) {
  if (!track) return null;
  if (track.authorId) return track.authorId;
  if (track.artist?.trim()) return `artist:${track.artist.trim()}`;
  return null;
}

function getSimilarTracks(seedTrack, catalogTracks = [], limit = 12) {
  if (!seedTrack?.id || !catalogTracks.length) return [];

  const authorId = resolveAuthorId(seedTrack);
  if (!authorId) return [];

  return catalogTracks
    .filter((track) => {
      if (track.id === seedTrack.id) return false;
      if (authorId.startsWith('artist:')) {
        const artistName = authorId.slice('artist:'.length);
        return normalizeArtist(track.artist) === normalizeArtist(artistName);
      }
      return track.authorId === authorId;
    })
    .slice(0, limit);
}

module.exports = { getSimilarTracks, resolveAuthorId };
