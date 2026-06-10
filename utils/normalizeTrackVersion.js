import { resolveServerMediaUrl } from './resolveServerMediaUrl';

export function normalizeTrackVersion(item) {
  if (!item || typeof item !== 'object') return item;

  const mediaUrl =
    resolveServerMediaUrl(item.mediaPath) ||
    resolveServerMediaUrl(item.mediaUrl) ||
    null;

  const userAvatarUrl =
    resolveServerMediaUrl(item.userAvatarPath) ||
    resolveServerMediaUrl(item.userAvatarUrl) ||
    null;

  return {
    ...item,
    mediaUrl,
    userAvatarUrl,
  };
}
