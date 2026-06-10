import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

const BAR_DELAYS = [0, 60, 120, 40, 100, 20, 80, 140, 50, 110, 30, 90, 70, 130];

const VARIANTS = {
  wave: {
    bar: 'rgba(255,255,255,0.35)',
    barBright: 'rgba(255,255,255,0.65)',
    barPlayed: 'rgba(255,255,255,0.85)',
    barUpcoming: 'rgba(255,255,255,0.2)',
    gap: 3,
    width: 3,
  },
  mini: {
    bar: 'rgba(255,255,255,0.4)',
    barBright: 'rgba(255,255,255,0.85)',
    barPlayed: 'rgba(255,255,255,0.9)',
    barUpcoming: 'rgba(255,255,255,0.22)',
    gap: 2,
    width: 2,
  },
  light: {
    bar: 'rgba(0,0,0,0.18)',
    barBright: 'rgba(0,0,0,0.5)',
    barPlayed: 'rgba(0,0,0,0.55)',
    barUpcoming: 'rgba(0,0,0,0.12)',
    gap: 2,
    width: 3,
  },
  player: {
    bar: '#111',
    barBright: '#111',
    barPlayed: '#111',
    barUpcoming: 'rgba(0,0,0,0.12)',
    gap: 1,
    width: 2,
    playedZone: 'rgba(0,0,0,0.08)',
    playhead: '#111',
  },
};

function EqualizerBar({
  index,
  isPlaying,
  height,
  variantKey,
  progress,
  barCount,
}) {
  const scale = useSharedValue(0.3);
  const theme = VARIANTS[variantKey] || VARIANTS.wave;
  const barPosition = (index + 0.5) / barCount;
  const isPlayed = progress != null && barPosition <= progress;

  useEffect(() => {
    const idleScale = isPlayed ? 0.5 + (index % 4) * 0.08 : 0.18 + (index % 3) * 0.04;
    const peakScale = isPlayed
      ? 0.75 + (index % 7) * 0.08
      : 0.28 + (index % 5) * 0.06;
    const lowScale = isPlayed
      ? 0.45 + (index % 3) * 0.06
      : 0.14 + (index % 4) * 0.03;

    if (isPlaying) {
      const duration = 260 + (index % 5) * 40;
      scale.value = withDelay(
        BAR_DELAYS[index % BAR_DELAYS.length],
        withRepeat(
          withSequence(
            withTiming(peakScale, {
              duration,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(lowScale, {
              duration,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        )
      );
      return () => cancelAnimation(scale);
    }

    scale.value = withTiming(idleScale, { duration: 350 });
  }, [isPlaying, index, scale, isPlayed, barCount, progress]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  let backgroundColor = theme.barUpcoming || theme.bar;
  if (isPlayed) {
    backgroundColor =
      index % 2 === 0 ? theme.barPlayed : theme.barBright || theme.barPlayed;
  } else if (!theme.barUpcoming) {
    backgroundColor = index % 3 === 0 ? theme.barBright : theme.bar;
  }

  return (
    <Animated.View
      style={[
        {
          width: theme.width,
          height,
          borderRadius: theme.width,
          backgroundColor,
          zIndex: 2,
        },
        barStyle,
      ]}
    />
  );
}

export default function MusicEqualizer({
  isPlaying,
  barCount = 14,
  height = 28,
  variant = 'wave',
  progress,
  spread = false,
  style,
}) {
  const theme = VARIANTS[variant] || VARIANTS.wave;
  const progressPercent = Math.max(0, Math.min(progress ?? 0, 1)) * 100;
  const showProgress = progress != null && variant === 'player';

  const bars = (
    <View
      style={[
        styles.row,
        { height, gap: spread ? 2 : theme.gap },
        spread && styles.rowSpread,
      ]}
    >
      {Array.from({ length: barCount }, (_, index) => (
        <EqualizerBar
          key={index}
          index={index}
          isPlaying={isPlaying}
          height={height}
          variantKey={variant}
          progress={progress}
          barCount={barCount}
        />
      ))}
    </View>
  );

  if (!showProgress) {
    return <View style={[styles.wrap, style]}>{bars}</View>;
  }

  return (
    <View style={[styles.wrap, { height }, style]}>
      <View style={styles.trackBg} />
      <View
        style={[
          styles.playedZone,
          {
            width: `${progressPercent}%`,
            backgroundColor: theme.playedZone || 'rgba(0,0,0,0.08)',
          },
        ]}
      />
      <View
        style={[
          styles.playhead,
          {
            left: `${progressPercent}%`,
            backgroundColor: theme.playhead || '#111',
          },
        ]}
      />
      {bars}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  trackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 6,
  },
  playedZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
    zIndex: 0,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    borderRadius: 2,
    zIndex: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    zIndex: 1,
  },
  rowSpread: {
    justifyContent: 'space-between',
  },
});
