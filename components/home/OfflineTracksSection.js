import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../context/OfflineContext';
import { usePlayer } from '../../context/PlayerContext';
import HomeTrackCard from './HomeTrackCard';

export default function OfflineTracksSection() {
  const { offlineTracks, removeOffline, busyId } = useOffline();
  const { currentTrack, isPlaying, playTrack, openPlayer, togglePlay } =
    usePlayer();

  if (!offlineTracks.length) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="cloud-download-outline" size={22} color="#999" />
        <Text style={styles.emptyTitle}>Офлайн</Text>
        <Text style={styles.emptyText}>
          Нажмите ↓ на карточке трека, чтобы слушать без сети
        </Text>
      </View>
    );
  }

  const handlePlay = (track) => {
    const isCurrent = currentTrack?.id === track.id;
    if (isCurrent) {
      togglePlay();
      openPlayer();
      return;
    }
    playTrack(track, offlineTracks);
    openPlayer();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="cloud-done-outline" size={20} color="#111" />
        <Text style={styles.title}>Скачанные</Text>
        <Text style={styles.count}>{offlineTracks.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {offlineTracks.map((track) => (
          <HomeTrackCard
            key={track.id}
            track={track}
            isActive={currentTrack?.id === track.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            showOfflineBadge
            onRemoveOffline={() => removeOffline(track.id)}
            downloadBusy={busyId === track.id}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  count: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  row: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  emptyWrap: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginTop: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
