import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAlbums } from '../context/AlbumsContext';
import { useOsBack } from '../hooks/useOsBack';

function trackCountLabel(count) {
  if (count === 0) return 'Нет треков';
  if (count === 1) return '1 трек';
  if (count >= 2 && count <= 4) return `${count} трека`;
  return `${count} треков`;
}

export default function AlbumsScreen({ onBack, onOpenAuthor }) {
  useOsBack(onBack);
  const { albums, removeAlbum } = useAlbums();

  const listHeader = (
    <View style={styles.hero}>
      <View style={styles.heroIcon}>
        <Ionicons name="albums" size={28} color="#111" />
      </View>
      <Text style={styles.heroTitle}>Альбомы</Text>
      <Text style={styles.heroSubtitle}>
        {albums.length}{' '}
        {albums.length === 1
          ? 'альбом'
          : albums.length >= 2 && albums.length <= 4
            ? 'альбома'
            : 'альбомов'}
      </Text>
    </View>
  );

  const emptyComponent = (
    <View style={styles.empty}>
      <Ionicons name="albums-outline" size={48} color="#ccc" />
      <Text style={styles.emptyTitle}>Пока нет альбомов</Text>
      <Text style={styles.emptyText}>
        Откройте профиль автора и нажмите «Добавить альбом»
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.topTitle}>Альбомы</Text>
        <View style={styles.topSpacer} />
      </View>

      <FlatList
        data={albums}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={albums.length ? listHeader : null}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              onOpenAuthor?.({
                authorId: item.authorId,
                authorName: item.authorName,
              })
            }
          >
            {item.authorAvatarUrl ? (
              <Image
                source={{ uri: item.authorAvatarUrl }}
                style={styles.cover}
                contentFit="cover"
              />
            ) : (
              <View style={styles.coverFallback}>
                <Ionicons name="albums-outline" size={28} color="#666" />
              </View>
            )}
            <View style={styles.cardText}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {trackCountLabel(item.trackCount)}
              </Text>
            </View>
            <Pressable
              onPress={() => removeAlbum(item.authorId)}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <Ionicons name="close-circle" size={22} color="#bbb" />
            </Pressable>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  topSpacer: {
    width: 24,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
  },
  cover: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  coverFallback: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  cardMeta: {
    fontSize: 13,
    color: '#666',
  },
  removeBtn: {
    padding: 4,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
