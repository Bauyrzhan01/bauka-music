import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const COVER_SIZE = 52;

export default function HomeQuickTile({
  title,
  onPress,
  coverUri,
  coverColor = '#282828',
  icon,
  iconColor = '#fff',
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
    >
      <View style={[styles.cover, { backgroundColor: coverColor }]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImage} contentFit="cover" />
        ) : null}
        {icon ? (
          <View style={styles.iconOverlay}>
            <Ionicons name={icon} size={22} color={iconColor} />
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    height: COVER_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2b2b2b',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tilePressed: {
    backgroundColor: '#2b2b2b',
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  title: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 15,
  },
});
