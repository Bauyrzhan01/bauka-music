import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { usePlayer } from '../../context/PlayerContext';
import { getSimilarTracks } from '../../utils/getSimilarTracks';
import { enrichTrackWithCover } from '../../utils/trackCoverUrl';
import HomeTrackCard from '../home/HomeTrackCard';

export default function PlayerSimilarTracksSection({ baseTrack, playerTheme }) {
  const { tracks: catalogTracks } = useMusicCatalog();
  const { currentTrack, isPlaying, playTrack, openPlayer, togglePlay } =
    usePlayer();

  const similarTracks = useMemo(() => {
    return getSimilarTracks(baseTrack, catalogTracks, 16).map((track) =>
      enrichTrackWithCover(track)
    );
  }, [baseTrack, catalogTracks]);

  if (!similarTracks.length) return null;

  const handlePlay = (track) => {
    const isCurrent = currentTrack?.id === track.id;
    if (isCurrent) {
      togglePlay();
      openPlayer();
      return;
    }
    playTrack(track, similarTracks);
    openPlayer();
  };

  return (
    <View
      style={[
        styles.wrap,
        playerTheme && { borderTopColor: playerTheme.border },
      ]}
    >
      <Text
        style={[styles.title, playerTheme && { color: playerTheme.text }]}
      >
        Похожая музыка
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {similarTracks.map((track) => (
          <HomeTrackCard
            key={track.id}
            track={track}
            isActive={currentTrack?.id === track.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            titleColor={playerTheme?.text}
            artistColor={playerTheme?.textMuted}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  row: {
    gap: 12,
    paddingRight: 8,
    paddingBottom: 4,
  },
});
