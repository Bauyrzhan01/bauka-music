/** Совпадает с AnimatedPlayerArtwork PRESETS.large.wrapper */
export const PLAYER_ARTWORK_WRAPPER = 260;
export const PLAYER_ARTWORK_SCALE = 0.85;

/** Высота верха плеера: обложка (scale) + название (2 строки) + исполнитель */
export const PLAYER_SCROLL_TOP_HEIGHT =
  4 +
  Math.round(PLAYER_ARTWORK_WRAPPER * PLAYER_ARTWORK_SCALE) +
  8 +
  26 * 2 +
  4 +
  20;

export const PLAYER_CLIP_VIDEO_HEIGHT = 158;

/** Клип + караоке: крупное видео, текст внизу */
export const PLAYER_CLIP_KARAOKE_VIDEO_HEIGHT = 208;
export const PLAYER_CLIP_KARAOKE_GAP = 16;
export const PLAYER_CLIP_KARAOKE_LINES_HEIGHT = 88;

export const PLAYER_CLIP_WITH_KARAOKE_HEIGHT =
  PLAYER_CLIP_KARAOKE_VIDEO_HEIGHT +
  PLAYER_CLIP_KARAOKE_GAP +
  PLAYER_CLIP_KARAOKE_LINES_HEIGHT;
