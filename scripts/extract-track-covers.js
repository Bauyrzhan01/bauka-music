const fs = require('fs');
const path = require('path');
const { parseFile } = require('music-metadata');
const { MUSIC_DIR, AUDIO_EXT } = require('./musicPaths');

const COVERS_DIR = path.join(__dirname, '..', 'server', 'uploads', 'covers');

function coverFilenameFor(audioFilename) {
  const base = path.basename(audioFilename, path.extname(audioFilename));
  return `${base}.jpg`;
}

function getCoverPath(audioFilename) {
  return path.join(COVERS_DIR, coverFilenameFor(audioFilename));
}

function coverExists(audioFilename) {
  return fs.existsSync(getCoverPath(audioFilename));
}

async function extractCoverForFile(audioFilename) {
  const ext = path.extname(audioFilename).toLowerCase();
  if (!AUDIO_EXT.has(ext)) return null;

  fs.mkdirSync(COVERS_DIR, { recursive: true });

  const dest = getCoverPath(audioFilename);
  if (fs.existsSync(dest)) {
    return coverFilenameFor(audioFilename);
  }

  const filePath = path.join(MUSIC_DIR, audioFilename);
  if (!fs.existsSync(filePath)) return null;

  try {
    const metadata = await parseFile(filePath, { duration: false });
    const picture = metadata.common.picture?.[0];
    if (!picture?.data?.length) return null;

    fs.writeFileSync(dest, picture.data);
    return coverFilenameFor(audioFilename);
  } catch {
    return null;
  }
}

async function extractAllCovers(files) {
  const results = {};
  for (const file of files) {
    const coverFile = await extractCoverForFile(file);
    if (coverFile) results[file] = coverFile;
  }
  return results;
}

module.exports = {
  COVERS_DIR,
  coverFilenameFor,
  coverExists,
  extractCoverForFile,
  extractAllCovers,
};
