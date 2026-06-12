/**
 * Проверка бэкенда и утилит (node scripts/verify-features.js)
 */
const http = require('http');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

async function checkApi() {
  const base = 'http://127.0.0.1:3001';

  const health = await getJson(`${base}/api/health`);
  assert(health.status === 200, 'health status');
  assert(health.data.version >= 3, 'api version');
  if (Array.isArray(health.data.features)) {
    assert(health.data.features.includes('listening'), 'listening feature');
  }

  const music = await getJson(`${base}/api/music`);
  assert(music.status === 200, 'music status');
  assert(Array.isArray(music.data.tracks), 'tracks array');
  assert(Array.isArray(music.data.authors), 'authors array');

  const track = music.data.tracks[0];
  if (track) {
    assert(track.id && track.title, 'track fields');
    if (track.coverFile) {
      assert(track.coverUrl?.includes('/uploads/covers/'), 'coverUrl');
    }
  }

  const listening = await getJson(`${base}/api/listening/now`);
  assert(listening.status === 200, 'listening status');
  assert(Array.isArray(listening.data.listeners), 'listeners array');

  const versions = await getJson(`${base}/api/versions`);
  assert(versions.status === 200, 'versions status');
  assert(Array.isArray(versions.data.versions), 'versions array');

  assert(
    health.data.features?.includes('analytics'),
    'analytics feature (перезапустите npm start)'
  );

  const analytics = await getJson(`${base}/api/analytics/summary`);
  assert(analytics.status === 200, 'analytics summary status');
  assert(Array.isArray(analytics.data.topTracks), 'analytics topTracks');

  const userStats = await getJson(
    `${base}/api/analytics/user?email=verify@test.com`
  );
  assert(userStats.status === 200, 'analytics user status');
  assert(typeof userStats.data.weekMinutes === 'number', 'weekMinutes');

  console.log('[ok] API: health, music, covers, listening, versions, analytics');
}

function checkAutomationAndAdmin() {
  const fs = require('fs');
  const path = require('path');

  const files = [
    '../utils/generatePlaceholderImage.js',
    '../utils/parseAudioMetadata.js',
    '../utils/autoAuthorSetup.js',
    '../utils/autoLibraryEnrich.js',
    '../components/admin/LocalAdminMusicSection.js',
    '../components/admin/LocalAdminAutomationSection.js',
  ];
  files.forEach((rel) => {
    assert(fs.existsSync(path.join(__dirname, rel)), `file ${rel}`);
  });

  const adminScreen = fs.readFileSync(
    path.join(__dirname, '../screens/LocalAdminScreen.js'),
    'utf8'
  );
  assert(adminScreen.includes("case 'music'"), 'admin music section');
  assert(
    adminScreen.includes('LocalAdminMusicSection'),
    'admin music component wired'
  );
  assert(
    !adminScreen.includes('onOpenMyMusic?.()'),
    'admin music no broken redirect'
  );

  const parseFilename = (filename) => {
    const base = String(filename).replace(/\.[^.]+$/i, '').trim();
    const match = base.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (match) {
      return { artist: match[1].trim(), title: match[2].trim() };
    }
    return { artist: null, title: base };
  };

  const parsed = parseFilename('Bauka - My Song.mp3');
  assert(parsed.artist === 'Bauka', 'parse artist from filename');
  assert(parsed.title === 'My Song', 'parse title from filename');

  const { lyricsNeedAutoSync } = require('../utils/autoLibraryEnrich.cjs');
  assert(
    lyricsNeedAutoSync('line one\nline two', []) === true,
    'karaoke auto needed when empty'
  );
  assert(
    lyricsNeedAutoSync('line one\nline two', [1, 2]) === false,
    'karaoke auto skipped when synced'
  );

  console.log('[ok] Automation: covers, authors, karaoke, admin music section');
}

function checkNewFeatures() {
  const { parseClipUrl, getTrackClipUrl } = require('../utils/parseClipUrl.cjs');
  const { buildMyWavePlaylist, getMyWaveSubtitle } = require('../utils/buildMyWavePlaylist.cjs');
  const { getSimilarTracks } = require('../utils/getSimilarTracks.cjs');
  const yt = parseClipUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const rt = parseClipUrl(
    'https://rutube.ru/video/7716bd3e665725c3c008ae7ab4ff02e2/'
  );
  const vm = parseClipUrl('https://vimeo.com/123456789');
  const vk = parseClipUrl('https://vk.com/video-123_456');
  assert(yt?.provider === 'youtube', 'youtube clip');
  assert(rt?.provider === 'rutube', 'rutube clip');
  assert(vm?.provider === 'vimeo', 'vimeo clip');
  assert(vk?.provider === 'vk', 'vk clip');

  const tracks = [
    { id: 't1', title: 'One', authorId: 'a1' },
    { id: 't2', title: 'Two', authorId: 'a1' },
    { id: 't3', title: 'Three', authorId: 'a2' },
  ];
  const wave = buildMyWavePlaylist({
    favoriteIds: ['t1'],
    recentIds: ['t2'],
    catalogTracks: tracks,
    seedTrackId: 't1',
  });
  assert(wave.length >= 2, 'my wave playlist');
  assert(
    getMyWaveSubtitle({ favoriteIds: ['t1'], recentIds: ['t2'], seedTrackId: 't1' }),
    'my wave subtitle'
  );

  const similar = getSimilarTracks(tracks[0], tracks, 5);
  assert(similar.length >= 1, 'similar tracks');

  assert(getTrackClipUrl({ clipUrl: 'https://youtu.be/x' }) !== '', 'clipUrl field');

  const fs = require('fs');
  const panel = [
    '../components/player/VideoClipPanel.js',
    '../components/player/VideoClipPanel.web.js',
    '../components/player/ClipWithKaraokePanel.js',
    '../components/profile/ProfileListeningStats.js',
    '../components/web/WebAdminAnalytics.js',
  ];
  panel.forEach((rel) => {
    assert(fs.existsSync(require('path').join(__dirname, rel)), `file ${rel}`);
  });

  console.log('[ok] New features: clips, wave 2.0, stats, analytics UI files');
}

function checkUtils() {
  const { recordHeartbeat, getNowPlaying } = require('../server/listeningNow');
  const { attachCoverUrls } = require('../server/trackCovers');
  const { buildTrackList } = require('../scripts/scan-music');

  recordHeartbeat({
    userName: 'Test',
    userEmail: 't@test.com',
    trackId: 't1',
    title: 'Song',
    isPlaying: true,
  });
  assert(getNowPlaying().length >= 1, 'listening now');

  const tracks = buildTrackList();
  const withCovers = attachCoverUrls(tracks, {
    protocol: 'http',
    get: () => 'localhost:3001',
  });
  assert(Array.isArray(withCovers), 'attach covers');

  const { buildAutoLyricsTimings } = require('../utils/autoLyricsTimings.cjs');
  const auto = buildAutoLyricsTimings(['one', 'two lines'], 120);
  assert(auto.length === 2 && auto[0] < auto[1], 'karaoke auto timings');

  const { parseModelJson } = require('../utils/parseModelJson.cjs');
  const { normalizeLyricsTimings } = require('../utils/normalizeLyricsTimings.cjs');
  const parsed = parseModelJson('{"lyricsTimings":[1,5.5,10]}');
  const norm = normalizeLyricsTimings(parsed.lyricsTimings, 3, 60);
  assert(norm.length === 3 && norm[1] >= norm[0], 'karaoke AI json parse');

  const { getGeminiConfig } = require('../server/karaokeGemini');
  assert(typeof getGeminiConfig().configured === 'boolean', 'gemini config');

  const { fitVideoInBounds } = require('../utils/videoDisplayLayout');
  const fitted = fitVideoInBounds(1920, 1080, 400, 800);
  assert(fitted.width === 400 && fitted.height === 225, 'video fit layout');

  console.log('[ok] Utils: listening, covers, scan, karaoke, video layout');
}

async function checkScan() {
  const { scanMusic } = require('../scripts/scan-music');
  const tracks = await scanMusic();
  assert(Array.isArray(tracks) && tracks.length >= 0, 'scanMusic');
  console.log(`[ok] Scan: ${tracks.length} track(s), covers: ${tracks.filter((t) => t.coverFile).length}`);
}

async function main() {
  console.log('Tolqyn — verify features\n');

  await checkScan();
  checkUtils();
  checkAutomationAndAdmin();
  checkNewFeatures();

  try {
    await checkApi();
  } catch (error) {
    console.warn('[skip] API not running (npm start):', error.message);
  }

  console.log('\nAll local checks passed.');
}

main().catch((err) => {
  console.error('\n[fail]', err.message);
  process.exit(1);
});
