import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const TIMING = {
  duration: 780,
  easing: Easing.bezier(0.4, 0.2, 0.2, 1),
};

function calculateGap(width) {
  const minWidth = 140;
  const maxWidth = 260;
  const minGap = 34;
  const maxGap = 52;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return maxGap;
  return (
    minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth))
  );
}

function getCardMetrics(index, activeIndex, length, gap) {
  const maxStickUp = gap * 0.75;
  const isActive = index === activeIndex;
  const isLeft = (activeIndex - 1 + length) % length === index;
  const isRight = (activeIndex + 1) % length === index;

  if (isActive) {
    return {
      zIndex: 3,
      translateX: 0,
      translateY: 0,
      scale: 1,
      opacity: 1,
      rotateY: 0,
    };
  }

  if (isLeft) {
    return {
      zIndex: 2,
      translateX: -gap,
      translateY: -maxStickUp,
      scale: 0.84,
      opacity: 0.92,
      rotateY: 12,
    };
  }

  if (isRight) {
    return {
      zIndex: 2,
      translateX: gap,
      translateY: -maxStickUp,
      scale: 0.84,
      opacity: 0.92,
      rotateY: -12,
    };
  }

  return {
    zIndex: 1,
    translateX: 0,
    translateY: 0,
    scale: 0.7,
    opacity: 0,
    rotateY: 0,
  };
}

function CarouselCard({
  item,
  index,
  activeIndex,
  length,
  gap,
  palette,
  onPress,
}) {
  const metrics = getCardMetrics(index, activeIndex, length, gap);
  const translateX = useSharedValue(metrics.translateX);
  const translateY = useSharedValue(metrics.translateY);
  const scale = useSharedValue(metrics.scale);
  const opacity = useSharedValue(metrics.opacity);
  const rotateY = useSharedValue(metrics.rotateY);

  useEffect(() => {
    const next = getCardMetrics(index, activeIndex, length, gap);
    translateX.value = withTiming(next.translateX, TIMING);
    translateY.value = withTiming(next.translateY, TIMING);
    scale.value = withTiming(next.scale, TIMING);
    opacity.value = withTiming(next.opacity, TIMING);
    rotateY.value = withTiming(next.rotateY, TIMING);
  }, [
    activeIndex,
    gap,
    index,
    length,
    opacity,
    rotateY,
    scale,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { perspective: 900 },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const isActive = index === activeIndex;
  const zIndex = getCardMetrics(index, activeIndex, length, gap).zIndex;

  return (
    <Animated.View
      style={[styles.imageCard, { zIndex }, animatedStyle]}
    >
      <Pressable style={styles.imagePress} onPress={onPress}>
        <Image
          source={{ uri: item.src }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        {item.badge ? (
          <View style={styles.rankBadge} pointerEvents="none">
            <Text style={styles.rankBadgeText}>{item.badge}</Text>
          </View>
        ) : null}
        {isActive ? (
          <Animated.View
            entering={FadeIn.duration(320)}
            exiting={FadeOut.duration(200)}
            style={styles.labelOverlay}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
              style={styles.labelGradient}
            >
              <Text style={[styles.overlayName, { color: palette.name }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text
                style={[styles.overlayArtist, { color: palette.designation }]}
                numberOfLines={1}
              >
                {item.designation}
              </Text>
            </LinearGradient>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const DEFAULT_COLORS = {
  name: '#ffffff',
  designation: 'rgba(255,255,255,0.82)',
};

export default function CircularFeaturedCarousel({
  items,
  autoplay = true,
  variant = 'light',
  colors = {},
  onItemPress,
}) {
  const isDark = variant === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const sectionWidth = screenWidth - 52;
  const imageColWidth = Math.round(Math.min(sectionWidth, 280) * 0.88);
  const stageHeight = Math.round(imageColWidth * 1.05);
  const gap = calculateGap(imageColWidth);

  const palette = { ...DEFAULT_COLORS, ...colors };
  const length = items.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayRef = useRef(null);
  const dragX = useSharedValue(0);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const handleNext = useCallback(() => {
    if (length < 2) return;
    stopAutoplay();
    setActiveIndex((prev) => (prev + 1) % length);
  }, [length, stopAutoplay]);

  const handlePrev = useCallback(() => {
    if (length < 2) return;
    stopAutoplay();
    setActiveIndex((prev) => (prev - 1 + length) % length);
  }, [length, stopAutoplay]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.15,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.3,
        onPanResponderGrant: () => {
          stopAutoplay();
        },
        onPanResponderMove: (_, gestureState) => {
          const maxDrag = gap * 1.15;
          dragX.value = Math.max(
            -maxDrag,
            Math.min(maxDrag, gestureState.dx)
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          const threshold = 34;
          if (gestureState.dx <= -threshold || gestureState.vx <= -0.28) {
            dragX.value = withTiming(0, { duration: 220 });
            handleNext();
            return;
          }
          if (gestureState.dx >= threshold || gestureState.vx >= 0.28) {
            dragX.value = withTiming(0, { duration: 220 });
            handlePrev();
            return;
          }
          dragX.value = withTiming(0, TIMING);
        },
        onPanResponderTerminate: () => {
          dragX.value = withTiming(0, TIMING);
        },
      }),
    [dragX, gap, handleNext, handlePrev, stopAutoplay]
  );

  const stageDragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

  useEffect(() => {
    if (!autoplay || length < 2) return undefined;
    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % length);
    }, 4500);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [autoplay, length]);

  if (!length) return null;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.imageColumn,
          { width: imageColWidth, height: stageHeight + 18 },
        ]}
      >
        <View
          style={[
            styles.decorCard,
            isDark ? styles.decorLeftDark : styles.decorLeft,
          ]}
        />
        <View
          style={[
            styles.decorCard,
            isDark ? styles.decorRightDark : styles.decorRight,
          ]}
        />

        <Animated.View
          style={[
            styles.imageStage,
            { width: imageColWidth, height: stageHeight },
            stageDragStyle,
          ]}
          {...panResponder.panHandlers}
        >
          {items.map((item, index) => (
            <CarouselCard
              key={item.id || `${item.src}-${index}`}
              item={item}
              index={index}
              activeIndex={activeIndex}
              length={length}
              gap={gap}
              palette={palette}
              onPress={() => {
                if (index === activeIndex) {
                  onItemPress?.(item, index);
                } else if (
                  (activeIndex - 1 + length) % length === index
                ) {
                  handlePrev();
                } else if ((activeIndex + 1) % length === index) {
                  handleNext();
                }
              }}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  imageColumn: {
    position: 'relative',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  decorCard: {
    position: 'absolute',
    width: '88%',
    height: '88%',
    borderRadius: 22,
  },
  decorLeft: {
    left: -6,
    top: 0,
    backgroundColor: '#b8c4e8',
    zIndex: 0,
  },
  decorLeftDark: {
    left: -6,
    top: 0,
    backgroundColor: '#1e3a5f',
    zIndex: 0,
  },
  decorRight: {
    right: -8,
    top: 4,
    backgroundColor: '#141414',
    zIndex: 0,
  },
  decorRightDark: {
    right: -8,
    top: 4,
    backgroundColor: '#0a0a0a',
    zIndex: 0,
  },
  imageStage: {
    alignSelf: 'center',
    position: 'relative',
    zIndex: 1,
  },
  imageCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  imagePress: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  rankBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 4,
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: 'rgba(30, 215, 96, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1ED760',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  rankBadgeText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  labelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  labelGradient: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 28,
  },
  overlayName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  overlayArtist: {
    fontSize: 12,
    fontWeight: '600',
  },
});
