import { resolveVersionMediaUrl } from './resolveVersionMediaUrl';

export function buildPlaybackTrack(baseTrack, userVersion = null) {
  if (!userVersion) {
    const localUri =
      baseTrack.offlineUri || baseTrack.localLibraryUri || null;
    if (localUri) {
      return {
        ...baseTrack,
        userVersion: null,
        playbackKind: 'offline',
        remoteUri: localUri,
        versionLabel: null,
      };
    }

    return {
      ...baseTrack,
      userVersion: null,
      playbackKind: 'bundled',
      remoteUri: null,
      versionLabel: null,
    };
  }

  const remoteUri = resolveVersionMediaUrl(userVersion);

  return {
    ...baseTrack,
    userVersion,
    playbackKind: userVersion.type === 'video' ? 'remote-video' : 'remote-audio',
    remoteUri,
    versionLabel: userVersion.title,
    versionAuthor: userVersion.userName,
  };
}

export function getBaseTrackId(track) {
  return track?.id;
}
