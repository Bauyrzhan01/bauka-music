import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

export default function UserAvatarChip({
  uri,
  name,
  size = 24,
  variant = 'onDark',
  accentColor,
}) {
  const isDark = variant === 'onDark';
  const borderColor =
    accentColor || (isDark ? 'rgba(255,255,255,0.45)' : '#111111');
  const fallbackBg = isDark ? 'rgba(255,255,255,0.18)' : '#f0f0f0';
  const iconColor = isDark ? '#ffffff' : '#111111';
  const initial = name?.trim()?.[0]?.toUpperCase() || null;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
          backgroundColor: fallbackBg,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : initial ? (
        <Text style={[styles.initial, { fontSize: size * 0.42, color: iconColor }]}>
          {initial}
        </Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color={iconColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontWeight: '700',
  },
});
