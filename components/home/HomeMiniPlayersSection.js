import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { useOffline } from '../../context/OfflineContext';
import { usePlayer } from '../../context/PlayerContext';
import { buildMyWavePlaylist } from '../../utils/buildMyWavePlaylist';
import { loadRecentTrackIds } from '../../storage/recentListensStorage';
import HomeMiniPlayerCard, {
  getHomeMiniPlayerCardWidth,
} from './HomeMiniPlayerCard';

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 10;

function dedupeTracks(tracks) {
  const seen = new Set();
  return tracks.filter((track) => {
    if (!track?.id || seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });
}

export default function HomeMiniPlayersSection() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = getHomeMiniPlayerCardWidth(screenWidth, {
    horizontalPadding: HORIZONTAL_PADDING,
    gap: CARD_GAP,
    columns: 2,
  });
  const snapInterval = cardWidth + CARD_GAP;

  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const { catalogTracks } = useOffline();
  const {
    baseTrack,
    currentTrack,
    isPlaying,
    positionMillis,
    durationMillis,
    playTrack,
    togglePlay,
    openPlayer,
  } = usePlayer();
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    loadRecentTrackIds().then(setRecentIds);
  }, []);

  const tracks = useMemo(() => {
    const wave = buildMyWavePlaylist({
      favoriteIds,
      recentIds,
      catalogTracks,
      seedTrackId: null,
    });

    const favorites = catalogTracks.filter((track) =>
      favoriteIds.includes(track.id)
    );

    return dedupeTracks([...wave, ...favorites]).slice(0, 6);
  }, [favoriteIds, recentIds, catalogTracks]);

  if (!tracks.length) return null;

  const activeId = baseTrack?.id || currentTrack?.id;

  const playFromCard = (track) => {
    playTrack(track, tracks);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Слушайте сейчас</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
      >
        {tracks.map((track) => {
          const isActive = activeId === track.id;
          return (
            <HomeMiniPlayerCard
              key={track.id}
              width={cardWidth}
              track={track}
              isActive={isActive}
              isPlaying={isActive && isPlaying}
              positionMillis={isActive ? positionMillis : 0}
              durationMillis={isActive ? durationMillis : 0}
              isFavorite={isFavorite(track.id)}
              onPlay={() => playFromCard(track)}
              onTogglePlay={togglePlay}
              onToggleFavorite={() => toggleFavorite(track.id)}
              onOpen={openPlayer}
            />
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
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: CARD_GAP,
    paddingBottom: 4,
  },
});
