const path = require('path');
const { coverExists, coverFilenameFor } = require('../scripts/extract-track-covers');

function resolveCoverFile(track) {
  if (track.coverFile) return track.coverFile;
  if (track.filename && coverExists(track.filename)) {
    return coverFilenameFor(track.filename);
  }
  return null;
}

function attachCoverUrls(tracks, req) {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || '127.0.0.1:3001';

  return tracks.map((track) => {
    const coverFile = resolveCoverFile(track);
    return {
      ...track,
      coverFile: coverFile || null,
      coverUrl: coverFile
        ? `${protocol}://${host}/uploads/covers/${encodeURIComponent(coverFile)}`
        : null,
    };
  });
}

module.exports = {
  attachCoverUrls,
  resolveCoverFile,
};
