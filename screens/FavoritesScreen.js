import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import TrackResultItem from '../components/search/TrackResultItem';
import { useOsBack } from '../hooks/useOsBack';

export default function FavoritesScreen({ onBack }) {
  useOsBack(onBack);
  const { favoriteTracks } = useFavorites();
  const { playTrack, openPlayer, currentTrack } = usePlayer();

  const listHeader = (
    <View style={styles.hero}>
      <View style={styles.heroIcon}>
        <Ionicons name="heart" size={28} color="#111" />
      </View>
      <Text style={styles.heroTitle}>Избранное</Text>
      <Text style={styles.heroSubtitle}>
        {favoriteTracks.length}{' '}
        {favoriteTracks.length === 1 ? 'трек' : 'треков'}
      </Text>
    </View>
  );

  const emptyComponent = (
    <View style={styles.empty}>
      <Ionicons name="heart-outline" size={48} color="#ccc" />
      <Text style={styles.emptyTitle}>Пока пусто</Text>
      <Text style={styles.emptyText}>
        Нажмите ♡ в плеере или у трека, чтобы добавить сюда
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteTracks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={favoriteTracks.length ? listHeader : null}
        ListEmptyComponent={emptyComponent}
        renderItem={({ item }) => (
          <TrackResultItem
            track={item}
            active={currentTrack?.id === item.id}
            onPress={(track) => {
              playTrack(track, favoriteTracks);
              openPlayer();
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
