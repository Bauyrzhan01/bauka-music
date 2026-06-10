import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { shadeHex } from '../../utils/colorUtils';

const PRESETS = {
  mini: {
    wrapper: 42,
    inner: 28,
    outerRing: 38,
    innerRing: 34,
    icon: 16,
    dot: 3,
    orbitOuter: 18,
    orbitInner: 15,
  },
  cover: {
    wrapper: 88,
    inner: 56,
    outerRing: 80,
    innerRing: 72,
    icon: 28,
    dot: 4,
    orbitOuter: 36,
    orbitInner: 30,
  },
  large: {
    wrapper: 260,
    inner: 168,
    outerRing: 234,
    innerRing: 208,
    icon: 64,
    dot: 7,
    orbitOuter: 108,
    orbitInner: 92,
  },
};

function centerStyle(size, wrapper) {
  const offset = (wrapper - size) / 2;
  return { left: offset, top: offset };
}

function SpinningView({ duration, reverse = false, isPlaying, style, children }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(reverse ? -360 : 360, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      return;
    }

    cancelAnimation(rotation);
  }, [duration, reverse, isPlaying, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

function OrbitDots({ radius, dots, color, duration, reverse, isPlaying, wrapper, dotSize }) {
  const container = radius * 2 + dotSize;
  const offset = (wrapper - container) / 2;

  return (
    <SpinningView
      duration={duration}
      reverse={reverse}
      isPlaying={isPlaying}
      style={[
        styles.orbit,
        {
          width: container,
          height: container,
          left: offset,
          top: offset,
        },
      ]}
    >
      {dots.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = radius + radius * Math.cos(rad) - dotSize / 2;
        const y = radius + radius * Math.sin(rad) - dotSize / 2;

        return (
          <View
            key={angle}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                left: x,
                top: y,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </SpinningView>
  );
}

export default function AnimatedPlayerArtwork({
  size = 'large',
  isPlaying = false,
  variant = 'light',
  imageUri = null,
}) {
  const preset = PRESETS[size] ?? PRESETS.large;
  const accent = variant === 'dark' ? '#ffffff' : '#111111';
  const ringSoft = shadeHex(accent, variant === 'dark' ? 0.45 : 0.65);
  const ringMid = shadeHex(accent, variant === 'dark' ? 0.2 : -0.15);
  const ringOuterSoft = shadeHex(accent, variant === 'dark' ? 0.55 : 0.8);
  const dotBright = accent;
  const dotSoft = shadeHex(accent, variant === 'dark' ? 0.25 : 0.35);
  const centerBg = variant === 'dark' ? '#333333' : '#f4f4f5';
  const iconColor = variant === 'dark' ? '#ffffff' : '#111111';

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      return;
    }

    cancelAnimation(pulse);
    pulse.value = withTiming(1, { duration: 200 });
  }, [isPlaying, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      style={[
        styles.wrapper,
        { width: preset.wrapper, height: preset.wrapper },
      ]}
    >
      <OrbitDots
        radius={preset.orbitOuter}
        dots={[0, 90, 180, 270]}
        color={dotSoft}
        duration={4000}
        reverse={false}
        isPlaying={isPlaying}
        wrapper={preset.wrapper}
        dotSize={preset.dot}
      />
      <OrbitDots
        radius={preset.orbitInner}
        dots={[0, 120, 240]}
        color={dotBright}
        duration={2800}
        reverse
        isPlaying={isPlaying}
        wrapper={preset.wrapper}
        dotSize={preset.dot}
      />

      <SpinningView
        duration={3200}
        reverse
        isPlaying={isPlaying}
        style={[
          styles.ringOuter,
          centerStyle(preset.outerRing, preset.wrapper),
          {
            width: preset.outerRing,
            height: preset.outerRing,
            borderRadius: preset.outerRing / 2,
            borderColor: ringOuterSoft,
            borderBottomColor: accent,
            borderLeftColor: ringMid,
          },
        ]}
      />
      <SpinningView
        duration={2200}
        isPlaying={isPlaying}
        style={[
          styles.ring,
          centerStyle(preset.innerRing, preset.wrapper),
          {
            width: preset.innerRing,
            height: preset.innerRing,
            borderRadius: preset.innerRing / 2,
            borderColor: ringSoft,
            borderTopColor: accent,
            borderRightColor: ringMid,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.center,
          pulseStyle,
          centerStyle(preset.inner, preset.wrapper),
          {
            width: preset.inner,
            height: preset.inner,
            borderRadius: size === 'mini' ? 8 : preset.inner / 2,
            backgroundColor: centerBg,
          },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.centerImage,
              {
                width: preset.inner,
                height: preset.inner,
                borderRadius: size === 'mini' ? 8 : preset.inner / 2,
              },
            ]}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={imageUri}
          />
        ) : (
          <Ionicons name="musical-notes" size={preset.icon} color={iconColor} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  orbit: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
  ringOuter: {
    position: 'absolute',
    borderWidth: 2,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerImage: {
    position: 'absolute',
  },
});
