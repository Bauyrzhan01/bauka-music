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
import MusicEqualizer from '../player/MusicEqualizer';

function FloatingOrb({ size, left, top, dx, dy, duration, opacity }) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const pulse = useSharedValue(1);

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
          duration: duration * 1.15,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-dy, {
          duration: duration * 1.15,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.92, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [dx, dy, duration, offsetX, offsetY, pulse]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: pulse.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left,
          top,
          opacity,
        },
      ]}
    />
  );
}

export default function MyWaveVisuals({ isPlaying }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <FloatingOrb
        size={90}
        left="55%"
        top="8%"
        dx={12}
        dy={8}
        duration={4200}
        opacity={0.12}
      />
      <FloatingOrb
        size={56}
        left="72%"
        top="42%"
        dx={-8}
        dy={10}
        duration={3600}
        opacity={0.1}
      />
      <FloatingOrb
        size={40}
        left="48%"
        top="58%"
        dx={6}
        dy={-6}
        duration={3000}
        opacity={0.08}
      />

      <View style={styles.eqStrip}>
        <MusicEqualizer
          isPlaying={isPlaying}
          barCount={18}
          height={34}
          variant="wave"
          style={styles.eqBars}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  eqStrip: {
    position: 'absolute',
    left: 14,
    right: 78,
    bottom: 10,
    height: 36,
    justifyContent: 'flex-end',
  },
  eqBars: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
});
