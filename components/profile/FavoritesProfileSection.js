import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlayer } from '../../context/PlayerContext';
import FavoriteButton from '../FavoriteButton';

export default function FavoritesProfileSection({ onOpenAll }) {
  const { favoriteTracks, favoriteCount } = useFavorites();
  const { playTrack, openPlayer, currentTrack } = usePlayer();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="heart" size={18} color="#111" />
          <Text style={styles.title}>Избранное</Text>
          <Text style={styles.count}>{favoriteCount}</Text>
        </View>
        {favoriteCount > 0 ? (
          <Pressable onPress={onOpenAll}>
            <Text style={styles.link}>Все</Text>
          </Pressable>
        ) : null}
      </View>

      {favoriteCount === 0 ? (
        <Text style={styles.empty}>
          Нажмите ♡ в плеере, чтобы сохранить трек
        </Text>
      ) : (
        <View style={styles.list}>
          {favoriteTracks.slice(0, 5).map((track) => {
            const active = currentTrack?.id === track.id;
            return (
              <Pressable
                key={track.id}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => {
                  playTrack(track, favoriteTracks);
                  openPlayer();
                }}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="musical-note" size={16} color="#111" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.artist || 'Bauka Music'}
                  </Text>
                </View>
                <FavoriteButton trackId={track.id} size={22} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  count: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  empty: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowActive: {
    backgroundColor: '#f7f7f7',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  trackArtist: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
