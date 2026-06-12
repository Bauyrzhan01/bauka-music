function sortReelsByDate(reels) {
  return reels.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );
}

function mapVideoToReel(video, trackId, trackMeta = {}) {
  return {
    id: video.id,
    type: 'video',
    title: video.title || 'Видео',
    localUri: video.uri,
    mediaUrl: video.uri,
    baseTrackId: trackId,
    baseFilename: trackMeta.filename || null,
    trackTitle: trackMeta.title || 'Трек',
    userName: 'Я',
    userEmail: null,
    isLocalLibrary: true,
    libraryTrackId: trackMeta.isLocalLibrary ? trackId : null,
    libraryVideoId: video.id,
    createdAt: video.createdAt,
  };
}

export function collectLocalReels(entries = []) {
  const reels = [];

  for (const entry of entries) {
    for (const video of entry.videos || []) {
      reels.push(
        mapVideoToReel(video, entry.id, {
          title: entry.title,
          isLocalLibrary: true,
        })
      );
    }
  }

  return sortReelsByDate(reels);
}

export function collectStoredTrackReels(trackReelsMap = {}, resolveTrack = () => null) {
  const reels = [];

  for (const [trackId, videos] of Object.entries(trackReelsMap)) {
    const track = resolveTrack(trackId);
    for (const video of videos || []) {
      reels.push(
        mapVideoToReel(video, trackId, {
          title: track?.title,
          filename: track?.filename,
          isLocalLibrary: Boolean(track?.isLocalLibrary),
        })
      );
    }
  }

  return reels;
}

export function collectAllLocalReels(
  entries = [],
  trackReelsMap = {},
  resolveTrack = () => null
) {
  const fromEntries = collectLocalReels(entries);
  const fromStore = collectStoredTrackReels(trackReelsMap, resolveTrack);
  const seen = new Set(fromEntries.map((item) => item.id));

  return sortReelsByDate([
    ...fromEntries,
    ...fromStore.filter((item) => !seen.has(item.id)),
  ]);
}
