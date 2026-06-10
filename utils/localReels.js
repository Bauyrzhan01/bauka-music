export function collectLocalReels(entries = []) {
  const reels = [];

  for (const entry of entries) {
    for (const video of entry.videos || []) {
      reels.push({
        id: video.id,
        type: 'video',
        title: video.title || 'Видео',
        localUri: video.uri,
        mediaUrl: video.uri,
        baseTrackId: entry.id,
        baseFilename: null,
        trackTitle: entry.title,
        userName: 'Я',
        userEmail: null,
        isLocalLibrary: true,
        libraryTrackId: entry.id,
        libraryVideoId: video.id,
        createdAt: video.createdAt,
      });
    }
  }

  return reels.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );
}
