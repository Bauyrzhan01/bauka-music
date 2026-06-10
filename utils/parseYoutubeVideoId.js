/**
 * Извлекает ID видео из ссылки YouTube (watch, youtu.be, embed, shorts).
 * @param {string} input
 * @returns {string|null}
 */
export function parseYoutubeVideoId(input) {
  if (input == null) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    );
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && id.length >= 11 ? id.slice(0, 11) : null;
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const fromQuery = url.searchParams.get('v');
      if (fromQuery) return fromQuery.slice(0, 11);

      const embed = url.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1]) return embed[1].slice(0, 11);

      const shorts = url.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts?.[1]) return shorts[1].slice(0, 11);

      const live = url.pathname.match(/\/live\/([^/?]+)/);
      if (live?.[1]) return live[1].slice(0, 11);
    }
  } catch {
    return null;
  }

  return null;
}

export function buildYoutubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildYoutubeThumbnailUrl(videoId, quality = 'hqdefault') {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
