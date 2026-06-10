import { useWindowDimensions, Platform } from 'react-native';

export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;

export function useWebBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const isMobile = isWeb && width < MOBILE_BREAKPOINT;
  const isTablet =
    isWeb && width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
  const isDesktop = !isWeb || width >= TABLET_BREAKPOINT;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    contentPadding: isMobile ? 16 : isTablet ? 20 : 32,
    pageTitleSize: isMobile ? 22 : 28,
    touchMinHeight: isMobile ? 44 : 40,
  };
}
