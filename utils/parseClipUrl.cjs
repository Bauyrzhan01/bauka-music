function buildYoutubeEmbedUrl(videoId) {
  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function parseYoutube(input) {
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  if (/^[\w-]{11}$/.test(trimmed)) {
    return {
      provider: 'youtube',
      videoId: trimmed,
      embedUrl: buildYoutubeEmbedUrl(trimmed),
      thumbnailUrl: `https://img.youtube.com/vi/${trimmed}/hqdefault.jpg`,
    };
  }

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    );
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (!id) return null;
      const videoId = id.slice(0, 11);
      return {
        provider: 'youtube',
        videoId,
        embedUrl: buildYoutubeEmbedUrl(videoId),
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      let videoId =
        url.searchParams.get('v') ||
        url.pathname.match(/\/embed\/([^/?]+)/)?.[1] ||
        url.pathname.match(/\/shorts\/([^/?]+)/)?.[1] ||
        url.pathname.match(/\/live\/([^/?]+)/)?.[1];

      if (!videoId) return null;
      videoId = videoId.slice(0, 11);
      return {
        provider: 'youtube',
        videoId,
        embedUrl: buildYoutubeEmbedUrl(videoId),
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function parseRutube(input) {
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    );
    if (!url.hostname.includes('rutube.ru')) return null;

    const match = url.pathname.match(
      /\/(?:video\/private|video|play\/embed|shorts)\/([a-f0-9]{32})/i
    );
    const videoId = match?.[1];
    if (!videoId) return null;

    const embed = new URL(`https://rutube.ru/play/embed/${videoId}/`);
    const accessKey = url.searchParams.get('p');
    if (accessKey) embed.searchParams.set('p', accessKey);
    embed.searchParams.set('autoplay', 'true');

    return {
      provider: 'rutube',
      videoId,
      embedUrl: embed.toString(),
      thumbnailUrl: `https://pic.rutube.ru/thumb/${videoId}.jpg`,
    };
  } catch {
    return null;
  }
}

function parseVimeo(input) {
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    );
    if (!url.hostname.includes('vimeo.com')) return null;

    const videoId =
      url.pathname.match(/\/video\/(\d+)/)?.[1] ||
      url.pathname.match(/\/(\d+)(?:\/)?$/)?.[1];

    if (!videoId) return null;

    const embed = new URL(`https://player.vimeo.com/video/${videoId}`);
    embed.searchParams.set('autoplay', '1');
    embed.searchParams.set('title', '0');

    return {
      provider: 'vimeo',
      videoId,
      embedUrl: embed.toString(),
      thumbnailUrl: null,
    };
  } catch {
    return null;
  }
}

function parseVk(input) {
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    );
    const host = url.hostname.replace(/^www\./, '');
    if (!host.includes('vk.com') && !host.includes('vkvideo.ru')) return null;

    const match = url.pathname.match(/\/(?:video|clip)(-?\d+)_(\d+)/i);
    if (!match) return null;

    const oid = match[1];
    const id = match[2];
    const embed = new URL('https://vk.com/video_ext.php');
    embed.searchParams.set('oid', oid);
    embed.searchParams.set('id', id);
    embed.searchParams.set('hd', '2');
    embed.searchParams.set('autoplay', '1');

    return {
      provider: 'vk',
      videoId: `${oid}_${id}`,
      embedUrl: embed.toString(),
      thumbnailUrl: null,
    };
  } catch {
    return null;
  }
}

function parseClipUrl(input) {
  if (input == null) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.includes('rutube.ru')) return parseRutube(trimmed);
  if (lower.includes('vimeo.com')) return parseVimeo(trimmed);
  if (lower.includes('vk.com') || lower.includes('vkvideo.ru')) {
    return parseVk(trimmed);
  }

  return parseYoutube(trimmed);
}

function getClipProviderLabel(provider) {
  const labels = {
    youtube: 'YouTube',
    rutube: 'RuTube',
    vimeo: 'Vimeo',
    vk: 'VK',
  };
  return labels[provider] || 'Клип';
}

function getTrackClipUrl(track) {
  if (!track || typeof track !== 'object') return '';
  return String(track.clipUrl || track.youtubeUrl || '').trim();
}

module.exports = {
  parseClipUrl,
  parseYoutube,
  parseRutube,
  parseVimeo,
  parseVk,
  getTrackClipUrl,
  getClipProviderLabel,
  buildYoutubeEmbedUrl,
};
