import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import TrackCover from '../components/TrackCover';
import { enrichTrackWithCover } from '../utils/trackCoverUrl';
import { useOsBack } from '../hooks/useOsBack';

function FavoriteTrackRow({ track, active, onPress, onMenu }) {
  const enriched = enrichTrackWithCover(track);

  return (
    <Pressable
      style={[styles.trackRow, active && styles.trackRowActive]}
      onPress={onPress}
      onLongPress={onMenu}
    >
      <TrackCover
        coverUrl={enriched.coverUrl}
        size={52}
        borderRadius={6}
        iconSize={22}
      />
      <View style={styles.trackMeta}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artist || 'Tolqyn'}
        </Text>
      </View>
      <Pressable
        style={styles.menuBtn}
        onPress={(event) => {
          event.stopPropagation?.();
          onMenu();
        }}
        hitSlop={8}
        accessibilityLabel="Действия"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.55)" />
      </Pressable>
    </Pressable>
  );
}

export default function FavoritesScreen({ onBack }) {
  useOsBack(onBack);
  const { favoriteTracks, toggleFavorite } = useFavorites();
  const { playTrack, openPlayer, currentTrack, isPlaying, togglePlay } =
    usePlayer();

  const handlePlay = useCallback(
    (track) => {
      if (currentTrack?.id === track.id) {
        togglePlay();
        openPlayer();
        return;
      }
      playTrack(track, favoriteTracks);
      openPlayer();
    },
    [currentTrack?.id, favoriteTracks, openPlayer, playTrack, togglePlay]
  );

  const openTrackMenu = (track) => {
    Alert.alert(track.title || 'Трек', undefined, [
      { text: 'Слушать', onPress: () => handlePlay(track) },
      {
        text: 'Убрать из избранного',
        style: 'destructive',
        onPress: () => toggleFavorite(track.id),
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <Ionicons name="heart" size={26} color="#ff4d6d" style={styles.titleIcon} />
        <Text style={styles.pageTitle}>Избранное</Text>
      </View>
      <Text style={styles.pageSubtitle}>
        {favoriteTracks.length}{' '}
        {favoriteTracks.length === 1 ? 'трек' : 'треков'}
      </Text>

      {favoriteTracks.length > 0 ? (
        <Text style={styles.sectionLabel}>Все треки</Text>
      ) : null}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="heart-outline" size={40} color="rgba(255,255,255,0.35)" />
      </View>
      <Text style={styles.emptyTitle}>Пока пусто</Text>
      <Text style={styles.emptyText}>
        Нажмите ♡ в плеере или у трека, чтобы добавить сюда
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Назад">
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={favoriteTracks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          !favoriteTracks.length && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <FavoriteTrackRow
            track={item}
            active={currentTrack?.id === item.id && isPlaying}
            onPress={() => handlePlay(item)}
            onMenu={() => openTrackMenu(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 28,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  trackMeta: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  trackArtist: {
    marginTop: 3,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
});
