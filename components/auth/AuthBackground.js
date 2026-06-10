import { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const CIRCLES = [
  { size: 220, top: '8%', left: '-12%', color: 'rgba(99, 102, 241, 0.35)', dx: 40, dy: 30, duration: 5200 },
  { size: 160, top: '55%', left: '70%', color: 'rgba(168, 85, 247, 0.3)', dx: -35, dy: 45, duration: 4600 },
  { size: 280, top: '62%', left: '-18%', color: 'rgba(59, 130, 246, 0.22)', dx: 50, dy: -40, duration: 6200 },
  { size: 120, top: '22%', left: '78%', color: 'rgba(236, 72, 153, 0.28)', dx: -25, dy: 35, duration: 4000 },
  { size: 90, top: '78%', left: '45%', color: 'rgba(34, 211, 238, 0.25)', dx: 30, dy: -25, duration: 3800 },
];

function FloatingCircle({ size, top, left, color, dx, dy, duration }) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  useEffect(() => {
    offsetX.value = withRepeat(
      withSequence(
        withTiming(dx, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(-dx, { duration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    offsetY.value = withRepeat(
      withSequence(
        withTiming(dy, { duration: duration * 1.15, easing: Easing.inOut(Easing.ease) }),
        withTiming(-dy, { duration: duration * 1.15, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [dx, dy, duration, offsetX, offsetY]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.circle,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          left,
          backgroundColor: color,
        },
      ]}
    />
  );
}

export default function AuthBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.container, { width, height }]}>
      {CIRCLES.map((circle, index) => (
        <FloatingCircle key={index} {...circle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0b12',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
  },
});
