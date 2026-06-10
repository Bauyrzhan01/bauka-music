import { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../context/OfflineContext';
import { usePlayer } from '../../context/PlayerContext';
import HomeTrackCard from './HomeTrackCard';
import { getTracksForAuthor } from '../../utils/loadAuthorProfile';

export default function MoreFromAuthorSection({
  author,
  onOpenProfile,
  titlePrefix = 'Ещё от',
}) {
  const { catalogTracks } = useOffline();
  const { currentTrack, isPlaying, playTrack, openPlayer, togglePlay } =
    usePlayer();

  const authorId = author?.id ?? null;

  const tracks = useMemo(() => {
    if (!authorId) return [];
    const list = catalogTracks ?? [];
    const byId = Object.fromEntries(list.map((t) => [t.id, t]));
    return getTracksForAuthor(authorId, list).map((t) => byId[t.id] || t);
  }, [authorId, catalogTracks]);

  if (!authorId || !tracks.length) return null;

  const displayName = author?.name || 'Автор';

  const handlePlay = (track) => {
    const isCurrent = currentTrack?.id === track.id;
    if (isCurrent) {
      togglePlay();
      openPlayer();
      return;
    }
    const queue = tracks.length > 1 ? tracks : catalogTracks ?? [];
    playTrack(track, queue);
    openPlayer();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {titlePrefix} {displayName}
        </Text>
        <Pressable
          style={styles.profileBtn}
          onPress={() => onOpenProfile?.(author)}
          hitSlop={8}
        >
          <Text style={styles.profileText}>Профиль</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tracks.map((track) => (
          <HomeTrackCard
            key={track.id}
            track={track}
            isActive={currentTrack?.id === track.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  profileText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  row: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },
});
