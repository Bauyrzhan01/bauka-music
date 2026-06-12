/** Общая тёмная тема мобильного приложения */
export const mobileTheme = {
  bg: '#000000',
  surface: '#2b2b2b',
  surfaceLight: '#333333',
  surfaceMuted: '#1a1a1a',
  text: '#ffffff',
  textMuted: '#9a9a9a',
  textDim: '#666666',
  border: '#333333',
  accent: '#ffcc00',
  danger: '#ff4d6d',
  icon: '#ffffff',
  iconMuted: '#888888',
};

export const mobileScreen = {
  flex: 1,
  backgroundColor: mobileTheme.bg,
};

export const mobileBtn = {
  backgroundColor: mobileTheme.surface,
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 16,
};

export const mobileBtnText = {
  color: mobileTheme.text,
  fontSize: 15,
  fontWeight: '600',
};
