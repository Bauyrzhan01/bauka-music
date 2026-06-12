import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import MusicEqualizer from '../player/MusicEqualizer';
import MyWaveShaderBackground from './MyWaveShaderBackground';

function FloatingOrb({ size, left, top, dx, dy, duration, opacity, color = '#fff' }) {
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
        withTiming(1.1, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.94, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) })
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
          backgroundColor: color,
        },
      ]}
    />
  );
}

export default function MyWaveVisuals({ isPlaying, variant = 'default' }) {
  if (variant === 'yandex') {
    return (
      <View style={styles.wrap} pointerEvents="none">
        <View style={styles.shaderInset}>
          <MyWaveShaderBackground isPlaying={isPlaying} />
        </View>

        <LinearGradient
          colors={[
            'transparent',
            'transparent',
            'rgba(0,0,0,0.35)',
            'rgba(0,0,0,0.65)',
          ]}
          locations={[0, 0.55, 0.8, 1]}
          style={styles.shaderInset}
        />
      </View>
    );
  }

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
    backgroundColor: 'transparent',
  },
  shaderInset: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
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
