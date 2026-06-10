import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getKaraokePalette } from '../../utils/karaokePalettes';

const BUBBLES = [
  { size: 10, left: '6%', top: '18%', dx: 8, dy: 5, duration: 2800, opacity: 0.18 },
  { size: 7, left: '22%', top: '55%', dx: -6, dy: 7, duration: 2200, opacity: 0.14 },
  { size: 12, left: '38%', top: '12%', dx: 5, dy: -6, duration: 3200, opacity: 0.16 },
  { size: 8, left: '52%', top: '68%', dx: -7, dy: 4, duration: 2600, opacity: 0.12 },
  { size: 6, left: '68%', top: '32%', dx: 4, dy: 8, duration: 2000, opacity: 0.15 },
  { size: 11, left: '78%', top: '58%', dx: -5, dy: -5, duration: 3000, opacity: 0.13 },
  { size: 9, left: '88%', top: '22%', dx: 6, dy: 6, duration: 2400, opacity: 0.17 },
  { size: 7, left: '14%', top: '72%', dx: -4, dy: -7, duration: 2100, opacity: 0.11 },
  { size: 10, left: '45%', top: '42%', dx: 7, dy: -4, duration: 2700, opacity: 0.14 },
  { size: 6, left: '58%', top: '8%', dx: -6, dy: 5, duration: 1900, opacity: 0.16 },
];

function Bubble({ size, left, top, dx, dy, duration, opacity, color = '#111' }) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  useEffect(() => {
    offsetX.value = withRepeat(
      withSequence(
        withTiming(dx, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(-dx, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    offsetY.value = withRepeat(
      withSequence(
        withTiming(dy, {
          duration: duration * 1.1,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-dy, {
          duration: duration * 1.1,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, [dx, dy, duration, offsetX, offsetY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left,
          top,
          opacity,
          backgroundColor: color,
        },
      ]}
    />
  );
}

export default function KaraokeLineBubbles({ compact = false, tone = 'onLight' }) {
  const bubbles = compact ? BUBBLES.slice(0, 6) : BUBBLES;
  const bubbleColor = getKaraokePalette(tone).bubble;

  return (
    <View
      style={[styles.layer, compact && styles.layerCompact]}
      pointerEvents="none"
    >
      {bubbles.map((bubble, index) => (
        <Bubble key={index} {...bubble} color={bubbleColor} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 12,
  },
  layerCompact: {
    borderRadius: 8,
  },
  bubble: {
    position: 'absolute',
  },
});
