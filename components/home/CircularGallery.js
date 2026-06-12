import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * RN-порт circular-gallery из web-промпта.
 * items: { common, binomial, photo: { url, text, by?, pos? } }
 */
export default function CircularGallery({
  items = [],
  radius,
  autoRotateSpeed = 0.12,
  onItemPress,
  style,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(Math.round(screenWidth * 0.48), 176);
  const cardHeight = Math.round(cardWidth * 1.33);
  const ringRadius = radius ?? Math.round(screenWidth * 0.44);
  const length = items.length;

  const rotation = useSharedValue(0);
  const isInteracting = useSharedValue(false);
  const interactionTimerRef = useRef(null);

  const markInteracting = useCallback(() => {
    isInteracting.value = true;
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = setTimeout(() => {
      isInteracting.value = false;
    }, 150);
  }, [isInteracting]);

  useEffect(
    () => () => {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
    },
    []
  );

  useFrameCallback(() => {
    'worklet';
    if (isInteracting.value) return;
    rotation.value += autoRotateSpeed;
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.1,
        onPanResponderGrant: () => {
          runOnJS(markInteracting)();
        },
        onPanResponderMove: (_, g) => {
          rotation.value += g.dx * 0.18;
          runOnJS(markInteracting)();
        },
        onPanResponderRelease: () => {
          runOnJS(markInteracting)();
        },
      }),
    [markInteracting, rotation]
  );

  const anglePerItem = length > 0 ? 360 / length : 360;

  const handlePress = useCallback(
    (index) => {
      const item = items[index];
      if (item) onItemPress?.(item, index);
    },
    [items, onItemPress]
  );

  if (!length) return null;

  return (
    <View
      style={[styles.root, { height: cardHeight + 36 }, style]}
      accessibilityRole="adjustable"
      accessibilityLabel="Круговая 3D галерея"
      {...panResponder.panHandlers}
    >
      <View style={styles.stage}>
        {items.map((item, index) => (
          <GalleryCard
            key={item.id || item.photo?.url || `${index}`}
            item={item}
            index={index}
            length={length}
            anglePerItem={anglePerItem}
            rotation={rotation}
            ringRadius={ringRadius}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            onPress={() => handlePress(index)}
          />
        ))}
      </View>
    </View>
  );
}

function GalleryCard({
  item,
  index,
  length,
  anglePerItem,
  rotation,
  ringRadius,
  cardWidth,
  cardHeight,
  onPress,
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const itemAngle = index * anglePerItem;
    const totalRotation = rotation.value % 360;
    const relativeAngle = (itemAngle + totalRotation + 360) % 360;
    const normalizedAngle = Math.abs(
      relativeAngle > 180 ? 360 - relativeAngle : relativeAngle
    );
    const opacity = Math.max(0.28, 1 - normalizedAngle / 180);

    const angleFromFront =
      relativeAngle > 180 ? relativeAngle - 360 : relativeAngle;
    const rad = (angleFromFront * Math.PI) / 180;
    const translateX = Math.sin(rad) * ringRadius * 0.98;
    const depth = Math.cos(rad);
    const scale = 0.52 + 0.48 * ((depth + 1) / 2);
    const rotateY = -angleFromFront * 0.92;
    const zIndex = Math.round((depth + 1) * 50);

    return {
      opacity,
      zIndex,
      transform: [
        { perspective: 1200 },
        { translateX },
        { scale },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  const isFront = useAnimatedStyle(() => {
    const itemAngle = index * anglePerItem;
    const totalRotation = rotation.value % 360;
    const relativeAngle = (itemAngle + totalRotation + 360) % 360;
    const normalizedAngle = Math.abs(
      relativeAngle > 180 ? 360 - relativeAngle : relativeAngle
    );
    return { opacity: normalizedAngle < 22 ? 1 : 0 };
  });

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          width: cardWidth,
          height: cardHeight,
          marginLeft: -cardWidth / 2,
          marginTop: -cardHeight / 2,
        },
        animatedStyle,
      ]}
    >
      <Pressable style={styles.cardPress} onPress={onPress}>
        <View style={styles.card}>
          <Image
            source={{ uri: item.photo?.url }}
            style={styles.image}
            contentFit="cover"
            contentPosition={item.photo?.pos || 'center'}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            {item.badge ? (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{item.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.title} numberOfLines={2}>
              {item.common}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.binomial}
            </Text>
          </LinearGradient>
          <Animated.View style={[styles.frontHint, isFront]} pointerEvents="none">
            <Text style={styles.frontHintText}>Нажмите для воспроизведения</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  cardPress: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 12,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#1ED760',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rankText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 17,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    marginTop: 3,
    fontStyle: 'italic',
  },
  frontHint: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frontHintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '600',
  },
});
