export function resolveTrackForVersion(item, tracks = []) {
  if (!item || !tracks.length) return null;

  if (item.baseTrackId) {
    const byId = tracks.find((track) => track.id === item.baseTrackId);
    if (byId) return byId;
  }

  if (item.baseFilename) {
    const byFile = tracks.find((track) => track.filename === item.baseFilename);
    if (byFile) return byFile;
  }

  return null;
}
