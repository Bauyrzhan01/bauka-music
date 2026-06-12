import { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { usePlayer } from '../../context/PlayerContext';
import { getSimilarTracks } from '../../utils/getSimilarTracks';
import { enrichTrackWithCover } from '../../utils/trackCoverUrl';
import TrackCover from '../TrackCover';

const CARD_BG = '#282828';
const COVER_SIZE = 88;
const TRACK_SIZE = 72;

function QueueTrackItem({ track, onPress, dimmed = false }) {
  return (
    <Pressable style={styles.trackItem} onPress={() => onPress(track)}>
      <TrackCover
        coverUrl={track.coverUrl}
        size={TRACK_SIZE}
        borderRadius={8}
        iconSize={22}
        style={dimmed ? styles.trackCoverDimmed : undefined}
      />
      <Text style={styles.trackTitle} numberOfLines={2}>
        {track.title}
      </Text>
      <Text style={styles.trackArtist} numberOfLines={1}>
        {track.artist}
      </Text>
    </Pressable>
  );
}

export default function PlayerAuthorQueueRow({ baseTrack, coverUrl }) {
  const { tracks: catalogTracks } = useMusicCatalog();
  const {
    previousTracks,
    upcomingTracks,
    playlistTracks,
    playTrack,
  } = usePlayer();

  const previousList = useMemo(
    () => previousTracks.map((track) => enrichTrackWithCover(track)),
    [previousTracks]
  );

  const nextList = useMemo(() => {
    if (upcomingTracks.length) {
      return upcomingTracks.map((track) => enrichTrackWithCover(track));
    }
    return getSimilarTracks(baseTrack, catalogTracks, 12).map((track) =>
      enrichTrackWithCover(track)
    );
  }, [upcomingTracks, baseTrack, catalogTracks]);

  const hasQueue = previousList.length > 0 || nextList.length > 0;
  const showSimilarFallback = !upcomingTracks.length && nextList.length > 0;

  const handlePlay = (track) => {
    playTrack(track, playlistTracks);
  };

  if (!baseTrack) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.coverCol}>
          <TrackCover
            coverUrl={coverUrl}
            size={COVER_SIZE}
            borderRadius={10}
            iconSize={28}
          />
          <Text style={styles.coverTitle} numberOfLines={2}>
            {baseTrack.title}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.trackScroll}
          contentContainerStyle={styles.trackRow}
        >
          {previousList.length ? (
            <>
              <Text style={styles.scrollLabel}>Раньше</Text>
              {previousList.map((track) => (
                <QueueTrackItem
                  key={`prev-${track.id}`}
                  track={track}
                  onPress={handlePlay}
                  dimmed
                />
              ))}
            </>
          ) : null}

          {previousList.length && nextList.length ? (
            <View style={styles.divider} />
          ) : null}

          {nextList.length ? (
            <>
              <Text style={styles.scrollLabel}>
                {showSimilarFallback ? 'Похожее' : 'Далее'}
              </Text>
              {nextList.map((track) => (
                <QueueTrackItem
                  key={`next-${track.id}`}
                  track={track}
                  onPress={handlePlay}
                />
              ))}
            </>
          ) : null}

          {!hasQueue ? (
            <View style={styles.emptyQueue}>
              <Text style={styles.emptyText}>Нет треков в очереди</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  coverCol: {
    width: COVER_SIZE,
    alignItems: 'center',
  },
  coverTitle: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 14,
  },
  trackScroll: {
    flex: 1,
  },
  trackRow: {
    alignItems: 'flex-start',
    gap: 10,
    paddingRight: 4,
  },
  scrollLabel: {
    alignSelf: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginRight: 2,
  },
  divider: {
    width: 1,
    height: TRACK_SIZE,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 4,
  },
  trackItem: {
    width: TRACK_SIZE,
  },
  trackCoverDimmed: {
    opacity: 0.72,
  },
  trackTitle: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 14,
  },
  trackArtist: {
    marginTop: 2,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  emptyQueue: {
    height: COVER_SIZE,
    justifyContent: 'center',
    paddingRight: 12,
  },
  emptyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
});
