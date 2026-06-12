import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export default function GlassSurface({
  children,
  style,
  intensity = 42,
  borderColor = 'rgba(255,255,255,0.14)',
  backgroundColor = 'rgba(255,255,255,0.06)',
}) {
  const innerStyle = [
    styles.inner,
    { borderColor, backgroundColor },
    style,
  ];

  if (Platform.OS === 'web') {
    return <View style={innerStyle}>{children}</View>;
  }

  return (
    <BlurView intensity={intensity} tint="dark" style={styles.blur}>
      <View style={innerStyle}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  inner: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
});
