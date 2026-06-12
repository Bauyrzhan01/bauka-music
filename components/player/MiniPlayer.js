import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../../context/PlayerContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useTrackCoverUrl } from '../../hooks/useTrackCoverUrl';

export default function MiniPlayer() {
  const {
    currentTrack,
    baseTrack,
    isPlaying,
    togglePlay,
    openPlayer,
  } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const coverUrl = useTrackCoverUrl(currentTrack);

  if (!currentTrack) return null;

  const trackId = baseTrack?.id || currentTrack.id;
  const favorited = isFavorite(trackId);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.row} onPress={openPlayer}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPh]}>
            <Ionicons name="musical-note" size={18} color="#888" />
          </View>
        )}

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist || 'Tolqyn'}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            toggleFavorite(trackId);
          }}
          hitSlop={8}
          style={styles.actionBtn}
          accessibilityLabel={favorited ? 'Убрать из избранного' : 'В избранное'}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={24}
            color="#fff"
          />
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            togglePlay();
          }}
          hitSlop={8}
          style={styles.actionBtn}
          accessibilityLabel={isPlaying ? 'Пауза' : 'Играть'}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={26}
            color="#fff"
            style={!isPlaying && styles.playOffset}
          />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 0,
    marginBottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  coverPh: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOffset: {
    marginLeft: 2,
  },
});
