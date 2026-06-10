import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { isStandaloneApp } from '../../constants/standalone';
import { useOffline } from '../../context/OfflineContext';
import { usePlayer } from '../../context/PlayerContext';
import HomeTrackCard from './HomeTrackCard';

export default function HomeTracksRow() {
  const { catalogTracks, downloadTrack, removeOffline, busyId } = useOffline();
  const { currentTrack, isPlaying, playTrack, openPlayer, togglePlay } =
    usePlayer();

  const handleDownload = (track) => {
    if (track.isOffline) {
      removeOffline(track.id);
      return;
    }
    downloadTrack(track);
  };

  const handlePlay = (track) => {
    const isCurrent = currentTrack?.id === track.id;
    if (isCurrent) {
      togglePlay();
      openPlayer();
      return;
    }
    playTrack(track, catalogTracks);
    openPlayer();
  };

  if (catalogTracks.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Треки</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {catalogTracks.map((track) => (
          <HomeTrackCard
            key={track.id}
            track={track}
            isActive={currentTrack?.id === track.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onDownload={isStandaloneApp() ? undefined : handleDownload}
            downloadBusy={busyId === track.id}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
});
