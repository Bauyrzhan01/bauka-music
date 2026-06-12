import { Image, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { enrichTrackWithCover } from './trackCoverUrl';

const APP_ICON = require('../assets/icon.png');

const LOCK_SCREEN_OPTIONS = {
  showSeekForward: true,
  showSeekBackward: true,
};

const assetUriCache = new Map();

function isValidArtworkUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith('file://') ||
    url.startsWith('content://') ||
    url.startsWith('assets-library://') ||
    url.startsWith('ph://')
  );
}

function isBundledAssetUri(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('/assets/') ||
    url.startsWith('asset:/') ||
    url.includes('android_res') ||
    url.includes('drawable-')
  );
}

async function resolveAssetModuleUri(moduleId) {
  if (moduleId == null) return null;
  if (assetUriCache.has(moduleId)) return assetUriCache.get(moduleId);

  try {
    const asset = Asset.fromModule(moduleId);
    if (!asset.downloaded) {
      await asset.downloadAsync();
    }
    const uri = asset.localUri || asset.uri || null;
    if (uri && isValidArtworkUrl(uri)) {
      assetUriCache.set(moduleId, uri);
      return uri;
    }
  } catch {
    // ignore
  }

  assetUriCache.set(moduleId, null);
  return null;
}

async function resolveMediaSessionArtworkUrl(track) {
  if (!track) return null;

  const enriched = enrichTrackWithCover(track);
  const coverUrl = enriched.coverUrl;

  if (coverUrl && /^https?:\/\//i.test(coverUrl)) {
    return coverUrl;
  }

  if (coverUrl && isValidArtworkUrl(coverUrl) && !isBundledAssetUri(coverUrl)) {
    return coverUrl;
  }

  if (track.cover != null) {
    const bundledUri = await resolveAssetModuleUri(track.cover);
    if (bundledUri) return bundledUri;
  }

  if (enriched.coverFile && coverUrl && isValidArtworkUrl(coverUrl)) {
    return coverUrl;
  }

  return resolveAssetModuleUri(APP_ICON);
}

export async function buildMediaSessionMetadataAsync(track) {
  if (!track) return null;

  const title =
    track.versionLabel && track.title
      ? `${track.title} — ${track.versionLabel}`
      : track.title || track.versionLabel || 'Без названия';
  const artist =
    track.versionAuthor || track.artist || track.userName || 'Автор';

  const metadata = {
    title,
    artist,
    albumTitle: track.album || 'Tolqyn',
  };

  const artworkUrl = await resolveMediaSessionArtworkUrl(track);
  if (artworkUrl) {
    metadata.artworkUrl = artworkUrl;
  }

  return metadata;
}

export function buildMediaSessionMetadata(track) {
  if (!track) return null;

  const enriched = enrichTrackWithCover(track);
  const title =
    track.versionLabel && track.title
      ? `${track.title} — ${track.versionLabel}`
      : track.title || track.versionLabel || 'Без названия';
  const artist =
    track.versionAuthor || track.artist || track.userName || 'Автор';

  const metadata = {
    title,
    artist,
    albumTitle: track.album || 'Tolqyn',
  };

  const coverUrl = enriched.coverUrl;
  if (coverUrl && /^https?:\/\//i.test(coverUrl)) {
    metadata.artworkUrl = coverUrl;
    return metadata;
  }

  const resolved = coverUrl ? Image.resolveAssetSource(coverUrl)?.uri : null;
  if (isValidArtworkUrl(resolved) && !isBundledAssetUri(resolved)) {
    metadata.artworkUrl = resolved;
    return metadata;
  }

  if (track.cover != null) {
    const bundled = Image.resolveAssetSource(track.cover)?.uri;
    if (isValidArtworkUrl(bundled) && Platform.OS === 'web') {
      metadata.artworkUrl = bundled;
    }
  }

  return metadata;
}

export async function refreshMediaSessionMetadata(player, track) {
  if (!supportsMediaSessionControls() || !player || !track) return false;

  const metadata = await buildMediaSessionMetadataAsync(track);
  if (!metadata) return false;

  if (typeof player.updateLockScreenMetadata === 'function') {
    player.updateLockScreenMetadata(metadata);
    return true;
  }

  if (typeof player.setActiveForLockScreen === 'function') {
    player.setActiveForLockScreen(true, metadata, getLockScreenOptions());
    return true;
  }

  return false;
}

export function getLockScreenOptions() {
  return LOCK_SCREEN_OPTIONS;
}

export function supportsMediaSessionControls() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
