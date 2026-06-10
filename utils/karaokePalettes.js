/** Палитры караоке: светлая обложка (onLight) / тёмная (onDark) */
export const KARAOKE_PALETTES = {
  onLight: {
    activeBg: '#f7f7f8',
    activeText: '#111111',
    inactiveText: '#7a7a7a',
    bubble: '#111111',
    border: 'rgba(0,0,0,0.1)',
  },
  onDark: {
    activeBg: 'rgba(255,255,255,0.14)',
    activeText: '#ffffff',
    inactiveText: 'rgba(255,255,255,0.42)',
    bubble: 'rgba(255,255,255,0.32)',
    border: 'rgba(255,255,255,0.14)',
  },
};

export function getKaraokePalette(tone = 'onLight') {
  return KARAOKE_PALETTES[tone] || KARAOKE_PALETTES.onLight;
}
