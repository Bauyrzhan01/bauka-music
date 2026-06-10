import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../context/OfflineContext';
import { usePlayer } from '../../context/PlayerContext';
import { loadRecentTrackIds } from '../../storage/recentListensStorage';
import { getTracksByIds } from '../../utils/getTracksByIds';
import TrackCover from '../TrackCover';

export default function ProfileRecentSection() {
  const { catalogTracks } = useOffline();
  const { playTrack, openPlayer, currentTrack } = usePlayer();
  const [tracks, setTracks] = useState([]);

  const refresh = useCallback(async () => {
    const ids = await loadRecentTrackIds();
    setTracks(getTracksByIds(ids, catalogTracks).slice(0, 8));
  }, [catalogTracks]);

  useEffect(() => {
    refresh();
  }, [refresh, currentTrack?.id]);

  if (!tracks.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={18} color="#111" />
        <Text style={styles.title}>Недавно слушали</Text>
      </View>
      <View style={styles.list}>
        {tracks.map((track) => {
          const active = currentTrack?.id === track.id;
          return (
            <Pressable
              key={track.id}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => {
                playTrack(track, tracks);
                openPlayer();
              }}
            >
              <TrackCover
                coverUrl={track.coverUrl}
                size={44}
                borderRadius={8}
              />
              <View style={styles.rowText}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist || 'Bauka Music'}
                </Text>
              </View>
              <Ionicons name="play-circle" size={28} color="#111" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
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
});
