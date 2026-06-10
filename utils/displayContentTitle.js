const PLACEHOLDER_TITLES = new Set([
  'моё видео',
  'мое видео',
  'мой контент',
  'мое видео',
]);

export function isAutoContentTitle(title) {
  const trimmed = String(title || '').trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  if (PLACEHOLDER_TITLES.has(lower)) return true;

  if (/^ver-\d+-[a-z0-9]+$/i.test(trimmed)) return true;
  if (/^\d{5,}$/.test(trimmed)) return true;
  if (/^[a-f0-9-]{32,}$/i.test(trimmed)) return true;

  if (
    /^(IMG_|VID_|MVIMG|PXL_|WP_|DSC_|SNAP|REC_|screen_|video_|AUD_)/i.test(
      trimmed
    )
  ) {
    return true;
  }

  if (/^[a-z0-9._\-]{14,}$/i.test(trimmed) && !/\s/.test(trimmed)) {
    return true;
  }

  // «Префикс 1», «рилс 2» при пакетной загрузке
  if (/^.+\s+\d{1,3}$/.test(trimmed)) return true;

  return false;
}

export function displayContentTitle(title) {
  const trimmed = String(title || '').trim();
  if (!trimmed || isAutoContentTitle(trimmed)) return null;
  return trimmed;
}
