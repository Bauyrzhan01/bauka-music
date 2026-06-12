import { hexToRgba, shadeHex } from './colorUtils';

const FALLBACK_ACCENT = '#7c5cff';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return { r: 124, g: 92, b: 255 };

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function luminance(rgb) {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

function mixHex(a, b, ratio) {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  const mix = (x, y) => Math.round(x * (1 - ratio) + y * ratio);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(ar.r, br.r))}${toHex(mix(ar.g, br.g))}${toHex(mix(ar.b, br.b))}`;
}

/**
 * Премиальная тёмная тема плеера: ambient-свечение из цвета обложки.
 */
export function buildPlayerTheme(accentHex) {
  const accent = accentHex?.startsWith('#') ? accentHex : FALLBACK_ACCENT;
  const coverIsLight = luminance(hexToRgb(accent)) > 0.5;

  const neon = coverIsLight ? shadeHex(accent, -0.15) : shadeHex(accent, 0.35);
  const glow = shadeHex(accent, coverIsLight ? 0.1 : 0.45);
  const deep = mixHex('#050508', accent, 0.22);
  const background = mixHex('#000000', deep, 0.85);
  const spotifyBg = mixHex('#121212', accent, 0.52);
  const backgroundSoft = mixHex('#0a0a12', accent, 0.18);
  const spotifyGreen = '#1DB954';

  const text = '#ffffff';
  const textMuted = 'rgba(255,255,255,0.62)';
  const icon = '#ffffff';
  const border = 'rgba(255,255,255,0.14)';
  const progressBg = 'rgba(255,255,255,0.1)';
  const surface = 'rgba(255,255,255,0.08)';
  const surfaceBorder = 'rgba(255,255,255,0.16)';

  return {
    accent,
    neon,
    glow,
    gradientStart: mixHex(background, glow, 0.35),
    gradientMid: mixHex(background, accent, 0.28),
    gradientEnd: '#000000',
    orb1: hexToRgba(glow, 0.55),
    orb2: hexToRgba(neon, 0.4),
    orb3: hexToRgba(shadeHex(accent, -0.2), 0.35),
    background,
    spotifyBg,
    spotifyGreen,
    backgroundSoft,
    coverIsLight,
    surface,
    surfaceBorder,
    isLight: false,
    tone: 'onDark',
    text,
    textMuted,
    icon,
    border,
    progressBg,
    playBtn: hexToRgba('#ffffff', 0.95),
    playIcon: '#0a0a0f',
    playBtnGlow: hexToRgba(neon, 0.65),
    modeBtn: 'rgba(255,255,255,0.1)',
    modeBtnActive: hexToRgba(neon, 0.85),
    modeIcon: 'rgba(255,255,255,0.85)',
    modeIconActive: '#0a0a0f',
    artworkVariant: 'dark',
    eqVariant: 'wave',
    favoriteActive: '#ff4d8d',
    miniBackground: mixHex('#14141c', accent, 0.2),
    panelTitle: text,
    panelText: textMuted,
    addBtnBg: hexToRgba(neon, 0.9),
    addBtnText: '#0a0a0f',
    loader: '#ffffff',
    glassBg: 'rgba(255,255,255,0.06)',
    glassBorder: 'rgba(255,255,255,0.14)',
  };
}

export const DEFAULT_PLAYER_THEME = buildPlayerTheme(FALLBACK_ACCENT);
