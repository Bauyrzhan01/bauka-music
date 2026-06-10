import { getApiBaseUrl } from '../constants/api';

export function resolveVersionMediaUrl(version) {
  if (!version) return null;

  const base = getApiBaseUrl().replace(/\/$/, '');

  if (version.mediaPath) {
    const path = version.mediaPath.startsWith('/')
      ? version.mediaPath
      : `/${version.mediaPath}`;
    return `${base}${path}`;
  }

  if (!version.mediaUrl) return null;

  const url = version.mediaUrl;

  try {
    const parsed = new URL(url);
    const isLocal =
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '[::1]';

    if (isLocal) {
      return `${base}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    if (url.startsWith('/')) {
      return `${base}${url}`;
    }
  }

  return url;
}
