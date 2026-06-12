import { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { shadeHex } from '../../utils/colorUtils';

const WRAPPER_SIZE = 120;
const OUTER_RING = 108;
const INNER_RING = 96;
const INNER_SIZE = 80;
const DOT_SIZE = 7;
const DEFAULT_ACCENT = '#000000';

function centerStyle(size) {
  const offset = (WRAPPER_SIZE - size) / 2;
  return { left: offset, top: offset };
}

function SpinningView({ duration, reverse = false, style, children }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    const target = reverse ? -360 : 360;
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(target, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [duration, reverse, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

function OrbitDots({ radius, dots, color, duration, reverse }) {
  const container = radius * 2 + DOT_SIZE;
  const offset = (WRAPPER_SIZE - container) / 2;

  return (
    <SpinningView
      duration={duration}
      reverse={reverse}
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
        const x = radius + radius * Math.cos(rad) - DOT_SIZE / 2;
        const y = radius + radius * Math.sin(rad) - DOT_SIZE / 2;

        return (
          <View
            key={angle}
            style={[
              styles.dot,
              {
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

export default function AnimatedProfileAvatar({
  avatarUri,
  accentColor = DEFAULT_ACCENT,
  onPress,
}) {
  const ringAccent = accentColor || DEFAULT_ACCENT;
  const ringSoft = shadeHex(ringAccent, 0.65);
  const ringMid = shadeHex(ringAccent, -0.15);
  const ringOuterSoft = shadeHex(ringAccent, 0.8);
  const dotBright = ringAccent;
  const dotSoft = shadeHex(ringAccent, 0.35);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Изменить фото профиля"
      style={styles.pressable}
    >
      <View style={styles.wrapper}>
        <OrbitDots
          radius={50}
          dots={[0, 90, 180, 270]}
          color={dotSoft}
          duration={4000}
          reverse={false}
        />
        <OrbitDots
          radius={42}
          dots={[0, 120, 240]}
          color={dotBright}
          duration={2800}
          reverse
        />

        <SpinningView
          duration={3200}
          reverse
          style={[
            styles.ringOuter,
            centerStyle(OUTER_RING),
            {
              borderColor: ringOuterSoft,
              borderBottomColor: ringAccent,
              borderLeftColor: ringMid,
            },
          ]}
        />
        <SpinningView
          duration={2200}
          style={[
            styles.ring,
            centerStyle(INNER_RING),
            {
              borderColor: ringSoft,
              borderTopColor: ringAccent,
              borderRightColor: ringMid,
            },
          ]}
        />

        <View style={styles.avatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="person" size={40} color="#ffffff" />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: WRAPPER_SIZE,
    height: WRAPPER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  orbit: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  ringOuter: {
    position: 'absolute',
    width: OUTER_RING,
    height: OUTER_RING,
    borderRadius: OUTER_RING / 2,
    borderWidth: 2,
  },
  ring: {
    position: 'absolute',
    width: INNER_RING,
    height: INNER_RING,
    borderRadius: INNER_RING / 2,
    borderWidth: 3,
  },
  avatar: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: INNER_SIZE,
    height: INNER_SIZE,
  },
});
