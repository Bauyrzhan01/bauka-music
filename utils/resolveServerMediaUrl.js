import { getApiBaseUrl } from '../constants/api';

/**
 * Путь или URL с API → рабочий адрес для текущего устройства (LAN / EXPO_PUBLIC_API_URL).
 * file:// и data: не меняются.
 */
export function resolveServerMediaUrl(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;

  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const base = getApiBaseUrl().replace(/\/$/, '');

  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const isLocal =
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '[::1]';

    if (isLocal) {
      return `${base}${parsed.pathname}${parsed.search}`;
    }

    return trimmed;
  } catch {
    return `${base}/${trimmed.replace(/^\//, '')}`;
  }
}

export function resolveAuthorAvatarUrl(author) {
  if (!author) return null;
  return (
    resolveServerMediaUrl(author.avatarPath) ||
    resolveServerMediaUrl(author.avatarUrl) ||
    null
  );
}
