import { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const PLACEHOLDERS = 6;
const SIZE = 44;

function SkeletonCircle() {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.item}>
      <Animated.View style={[styles.circle, style]} />
      <Animated.View style={[styles.line, style]} />
    </View>
  );
}

export default function AuthorRowSkeleton() {
  return (
    <View style={styles.wrap}>
      <Animated.View style={styles.titleBar} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {Array.from({ length: PLACEHOLDERS }, (_, i) => (
          <SkeletonCircle key={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  titleBar: {
    width: 72,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#ececec',
    marginLeft: 16,
    marginBottom: 10,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
  },
  item: {
    width: SIZE + 8,
    alignItems: 'center',
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#e8e8e8',
    marginBottom: 6,
  },
  line: {
    width: SIZE,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ececec',
  },
});
