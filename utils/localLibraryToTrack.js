export function localLibraryEntryToTrack(entry) {
  if (!entry?.id || !entry?.audioUri) return null;

  return {
    id: entry.id,
    title: entry.title || 'Без названия',
    artist: entry.artist || 'Я',
    description: entry.description || '',
    lyricsTimings: entry.lyricsTimings || [],
    clipUrl: entry.clipUrl || '',
    coverUrl: entry.coverUri || null,
    isLocalLibrary: true,
    offlineUri: entry.audioUri,
    localLibraryUri: entry.audioUri,
    localVideos: entry.videos || [],
    createdAt: entry.createdAt,
  };
}

export function localLibraryEntriesToTracks(entries = []) {
  return entries
    .map(localLibraryEntryToTrack)
    .filter(Boolean);
}
