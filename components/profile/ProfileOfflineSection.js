import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../context/OfflineContext';
import { usePlayer } from '../../context/PlayerContext';
import TrackCover from '../TrackCover';

export default function ProfileOfflineSection() {
  const { offlineTracks } = useOffline();
  const { playTrack, openPlayer, currentTrack } = usePlayer();

  if (!offlineTracks.length) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="cloud-download-outline" size={20} color="#999" />
        <Text style={styles.emptyTitle}>Скачанные треки</Text>
        <Text style={styles.emptyText}>
          В плеере нажмите ↓ на обложке — трек будет доступен без сети
        </Text>
      </View>
    );
  }

  const preview = offlineTracks.slice(0, 4);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="cloud-done-outline" size={18} color="#111" />
        <Text style={styles.title}>Скачанные</Text>
        <Text style={styles.count}>{offlineTracks.length}</Text>
      </View>
      <View style={styles.list}>
        {preview.map((track) => {
          const active = currentTrack?.id === track.id;
          return (
            <Pressable
              key={track.id}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => {
                playTrack(track, offlineTracks);
                openPlayer();
              }}
            >
              <TrackCover coverUrl={track.coverUrl} size={44} borderRadius={8} />
              <View style={styles.rowText}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist || 'Bauka Music'}
                </Text>
              </View>
              <Ionicons name="cloud-done" size={18} color="#16a34a" />
            </Pressable>
          );
        })}
      </View>
      {offlineTracks.length > preview.length ? (
        <Text style={styles.more}>
          Ещё {offlineTracks.length - preview.length} на главной в блоке «Скачанные»
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  emptyWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  count: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowActive: {
    backgroundColor: '#f7f7f7',
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
  more: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
