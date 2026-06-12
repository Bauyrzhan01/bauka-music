import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LOCAL_TRACKS } from '../../data/localTracks';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import AuthorItem from './AuthorItem';
import AuthorRowSkeleton from './AuthorRowSkeleton';

function authorsFromTracks(tracks) {
  const map = new Map();

  tracks.forEach((track) => {
    if (track.authorId) {
      const existing = map.get(track.authorId);
      if (existing) {
        existing.trackCount += 1;
      } else {
        map.set(track.authorId, {
          id: track.authorId,
          name: track.artist || 'Автор',
          trackCount: 1,
        });
      }
      return;
    }

    if (track.artist) {
      const key = `artist:${track.artist}`;
      const existing = map.get(key);
      if (existing) {
        existing.trackCount += 1;
      } else {
        map.set(key, {
          id: key,
          name: track.artist,
          trackCount: 1,
        });
      }
    }
  });

  return [...map.values()];
}

export default function AuthorRow({ onAuthorPress, selectedAuthorId }) {
  const { authors: catalogAuthors, refreshing } = useMusicCatalog();
  const fallbackAuthors = useMemo(() => authorsFromTracks(LOCAL_TRACKS), []);
  const authors = catalogAuthors.length ? catalogAuthors : fallbackAuthors;
  const loading = refreshing && !catalogAuthors.length;

  if (!loading && authors.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Авторы</Text>
      {loading ? (
        <AuthorRowSkeleton />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {authors.filter(Boolean).map((author) => (
            <AuthorItem
              key={author.id}
              author={author}
              selected={author.id === selectedAuthorId}
              onPress={onAuthorPress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  row: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
});
