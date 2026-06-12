import { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const PARTICLE_COUNT = 18;

function FloatingParticle({ index, color, width, height }) {
  const drift = useSharedValue(0);
  const opacity = useSharedValue(0.25 + (index % 5) * 0.1);

  useEffect(() => {
    const cycle = 4200 + (index % 7) * 600;
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: cycle, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: cycle, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: cycle * 0.6 }),
        withTiming(0.2, { duration: cycle * 0.6 })
      ),
      -1,
      false
    );
  }, [drift, index, opacity]);

  const left = ((index * 47) % 100) / 100;
  const top = ((index * 73) % 100) / 100;
  const size = 2 + (index % 3);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: (drift.value - 0.5) * 28 },
      { translateX: (drift.value - 0.5) * 18 },
      { scale: 0.8 + drift.value * 0.5 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        {
          left: left * width,
          top: top * height,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          shadowColor: color,
        },
      ]}
    />
  );
}

function AmbientOrb({ color, size, top, left, duration, reverse }) {
  const shift = useSharedValue(0);

  useEffect(() => {
    shift.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      reverse
    );
  }, [duration, reverse, shift]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (shift.value - 0.5) * 36 },
      { translateY: (shift.value - 0.5) * 28 },
      { scale: 0.92 + shift.value * 0.14 },
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
          top,
          left,
          backgroundColor: color,
        },
      ]}
    />
  );
}

export default function PremiumPlayerBackground({ theme }) {
  const { width, height } = useWindowDimensions();
  const wave = useSharedValue(0);

  useEffect(() => {
    wave.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [wave]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (wave.value - 0.5) * 60 },
      { translateY: (wave.value - 0.5) * 40 },
      { rotate: `${wave.value * 8 - 4}deg` },
    ],
  }));

  const waveStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: (0.5 - wave.value) * 50 },
      { translateY: (wave.value - 0.5) * 55 },
      { rotate: `${12 - wave.value * 10}deg` },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientMid, theme.gradientEnd]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.waveLayer, waveStyle]}>
        <LinearGradient
          colors={['transparent', theme.orb1, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.waveBlob, { width: width * 1.4, height: height * 0.55 }]}
        />
      </Animated.View>

      <Animated.View style={[styles.waveLayer, waveStyle2]}>
        <LinearGradient
          colors={['transparent', theme.orb2, 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.waveBlob,
            styles.waveBlobLower,
            { width: width * 1.2, height: height * 0.5 },
          ]}
        />
      </Animated.View>

      <AmbientOrb
        color={theme.orb1}
        size={width * 0.72}
        top={-height * 0.12}
        left={-width * 0.18}
        duration={11000}
      />
      <AmbientOrb
        color={theme.orb2}
        size={width * 0.58}
        top={height * 0.38}
        left={width * 0.42}
        duration={9000}
        reverse
      />
      <AmbientOrb
        color={theme.orb3}
        size={width * 0.48}
        top={height * 0.62}
        left={-width * 0.22}
        duration={13000}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <FloatingParticle
          key={i}
          index={i}
          color={i % 3 === 0 ? theme.neon : 'rgba(255,255,255,0.75)'}
          width={width}
          height={height}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  waveLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  waveBlob: {
    position: 'absolute',
    top: '8%',
    opacity: 0.55,
    borderRadius: 999,
  },
  waveBlobLower: {
    top: '42%',
    opacity: 0.42,
  },
  orb: {
    position: 'absolute',
    opacity: 0.38,
  },
  particle: {
    position: 'absolute',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
