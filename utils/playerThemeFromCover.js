import { shadeHex } from './colorUtils';

const FALLBACK_ACCENT = '#e8e8f0';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return { r: 232, g: 232, b: 240 };

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function luminance(rgb) {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

/**
 * Светлая обложка → светлый фон + тёмные элементы.
 * Тёмная обложка → тёмный фон + светлые элементы.
 */
export function buildPlayerTheme(accentHex) {
  const accent = accentHex?.startsWith('#') ? accentHex : FALLBACK_ACCENT;
  const coverIsLight = luminance(hexToRgb(accent)) > 0.5;

  const background = coverIsLight
    ? shadeHex(accent, 0.62)
    : shadeHex(accent, -0.45);
  const miniBackground = coverIsLight
    ? shadeHex(accent, 0.4)
    : shadeHex(accent, -0.52);

  // Светлая обложка → тёмные элементы; тёмная → светлые (по обложке, не по фону)
  const isLight = coverIsLight;

  const text = coverIsLight ? '#121212' : '#f5f5f5';
  const textMuted = coverIsLight
    ? 'rgba(18,18,18,0.65)'
    : 'rgba(245,245,245,0.75)';
  const icon = text;
  const border = coverIsLight
    ? 'rgba(0,0,0,0.12)'
    : 'rgba(255,255,255,0.18)';
  const progressBg = coverIsLight
    ? 'rgba(0,0,0,0.08)'
    : 'rgba(255,255,255,0.16)';
  const surface = coverIsLight
    ? 'rgba(255,255,255,0.72)'
    : 'rgba(0,0,0,0.28)';
  const surfaceBorder = coverIsLight
    ? 'rgba(0,0,0,0.1)'
    : 'rgba(255,255,255,0.12)';

  return {
    accent,
    background,
    backgroundSoft: coverIsLight
      ? shadeHex(accent, 0.48)
      : shadeHex(accent, -0.32),
    coverIsLight,
    surface,
    surfaceBorder,
    isLight,
    tone: coverIsLight ? 'onLight' : 'onDark',
    text,
    textMuted,
    icon,
    border,
    progressBg,
    playBtn: coverIsLight ? '#121212' : '#f5f5f5',
    playIcon: coverIsLight ? '#ffffff' : '#121212',
    modeBtn: coverIsLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.18)',
    modeBtnActive: coverIsLight ? '#121212' : '#f5f5f5',
    modeIcon: coverIsLight ? '#121212' : '#f5f5f5',
    modeIconActive: coverIsLight ? '#ffffff' : '#121212',
    artworkVariant: coverIsLight ? 'light' : 'dark',
    eqVariant: coverIsLight ? 'light' : 'wave',
    favoriteActive: coverIsLight ? '#c41e3a' : '#ff6b8a',
    miniBackground,
    panelTitle: text,
    panelText: textMuted,
    addBtnBg: coverIsLight ? '#121212' : '#f5f5f5',
    addBtnText: coverIsLight ? '#ffffff' : '#121212',
    loader: coverIsLight ? '#121212' : '#f5f5f5',
  };
}

export const DEFAULT_PLAYER_THEME = buildPlayerTheme(FALLBACK_ACCENT);
