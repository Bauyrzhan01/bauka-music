import { LOCAL_TRACKS } from '../data/localTracks';
import { enrichTrackWithCover } from './trackCoverUrl';

export function mergeCatalogTracks(remoteTracks = []) {
  const remoteByFilename = Object.fromEntries(
    remoteTracks.map((track) => [track.filename, track])
  );

  return LOCAL_TRACKS.map((local) => {
    const remote = remoteByFilename[local.filename];

    if (!remote) {
      return enrichTrackWithCover(local);
    }

    return enrichTrackWithCover({
      ...local,
      id: remote.id ?? local.id,
      title: remote.title ?? local.title,
      artist: remote.artist ?? local.artist,
      authorId: remote.authorId ?? local.authorId,
      description: remote.description ?? local.description,
      lyricsTimings: remote.lyricsTimings ?? local.lyricsTimings,
      clipUrl:
        remote.clipUrl ??
        remote.youtubeUrl ??
        local.clipUrl ??
        local.youtubeUrl ??
        '',
      coverUrl: remote.coverUrl ?? local.coverUrl ?? null,
      coverFile: remote.coverFile ?? local.coverFile ?? null,
    });
  });
}
