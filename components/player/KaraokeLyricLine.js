import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import KaraokeLineBubbles from './KaraokeLineBubbles';
import { KARAOKE_PALETTES } from '../../utils/karaokePalettes';

const AnimatedText = Animated.createAnimatedComponent(Text);

const TIMING = { duration: 380, easing: Easing.out(Easing.cubic) };

const PALETTES = {
  onLight: {
    bg: ['rgba(247,247,248,0)', 'rgba(247,247,248,0)', KARAOKE_PALETTES.onLight.activeBg],
    text: ['#7a7a7a', '#9a9a9a', KARAOKE_PALETTES.onLight.activeText],
  },
  onDark: {
    bg: ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', KARAOKE_PALETTES.onDark.activeBg],
    text: [
      KARAOKE_PALETTES.onDark.inactiveText,
      'rgba(255,255,255,0.58)',
      KARAOKE_PALETTES.onDark.activeText,
    ],
  },
};

export default function KaraokeLyricLine({
  text,
  isActive,
  isPast,
  bounded = false,
  tone = 'onLight',
}) {
  const palette = PALETTES[tone] || PALETTES.onLight;
  const focus = useSharedValue(isActive ? 1 : isPast ? 0.55 : 0.2);

  useEffect(() => {
    focus.value = withTiming(isActive ? 1 : isPast ? 0.55 : 0.2, TIMING);
  }, [isActive, isPast, focus]);

  const wrapStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      focus.value,
      [0, 0.55, 1],
      palette.bg
    );
    const scale = interpolate(focus.value, [0, 1], [1, bounded ? 1.015 : 1.025]);

    return {
      backgroundColor: bg,
      transform: [{ scale }],
      marginVertical: interpolate(focus.value, [0, 1], [2, bounded ? 3 : 6]),
      minHeight: interpolate(
        focus.value,
        [0, 1],
        [44, bounded ? 44 : 52]
      ),
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      focus.value,
      [0, 0.55, 1],
      [bounded ? 14 : 15, bounded ? 14 : 14, bounded ? 17 : 21]
    );
    const color = interpolateColor(
      focus.value,
      [0, 0.55, 1],
      bounded
        ? palette.text
        : [
            tone === 'onDark' ? 'rgba(255,255,255,0.35)' : '#b8b8b8',
            tone === 'onDark' ? 'rgba(255,255,255,0.5)' : '#d4d4d4',
            palette.text[2],
          ]
    );
    const opacity = interpolate(focus.value, [0, 0.55, 1], [0.55, 0.72, 1]);

    return {
      fontSize,
      lineHeight: fontSize * (bounded ? 1.35 : 1.33),
      color,
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.lineWrap, wrapStyle]}>
      {isActive ? (
        <Animated.View entering={FadeIn.duration(280)} style={styles.bubbles}>
          <KaraokeLineBubbles compact={bounded} tone={tone} />
        </Animated.View>
      ) : null}
      <AnimatedText
        style={[styles.line, textStyle, isActive && styles.lineActive]}
      >
        {text}
      </AnimatedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lineWrap: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  line: {
    textAlign: 'center',
    zIndex: 2,
  },
  lineActive: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bubbles: {
    ...StyleSheet.absoluteFillObject,
  },
});
