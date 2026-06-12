import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { resolveAuthorAvatarUrl } from '../../utils/resolveServerMediaUrl';

export default function HomeTrendsSection({ onAuthorPress }) {
  const { authors } = useMusicCatalog();

  const trends = useMemo(() => [...authors].slice(0, 8), [authors]);

  if (!trends.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Тренды</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {trends.map((author) => {
          const avatar = resolveAuthorAvatarUrl(author);
          const initial = (author.name || 'A').charAt(0).toUpperCase();
          return (
            <Pressable
              key={author.id}
              style={styles.item}
              onPress={() => onAuthorPress?.(author)}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPh}>
                  <Text style={styles.initial}>{initial}</Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={2}>
                {author.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    paddingHorizontal: 16,
    gap: 14,
  },
  item: {
    width: 88,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  avatarPh: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  initial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  name: {
    color: '#666666',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
});
