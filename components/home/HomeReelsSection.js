import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isStandaloneApp } from '../../constants/standalone';
import { fetchAllTrackVersions } from '../../api/trackVersionsApi';
import { useAuth } from '../../context/AuthContext';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { useMyLibrary } from '../../context/MyLibraryContext';
import { usePlayer } from '../../context/PlayerContext';
import { collectAllLocalReels } from '../../utils/localReels';
import { resolveTrackForVersion } from '../../utils/resolveTrackForVersion';
import ContentAuthorRow from '../player/ContentAuthorRow';
import ReelCardPreview from '../player/ReelCardPreview';
import ContentReelsViewer from '../player/ContentReelsViewer';

const CARD_WIDTH = 108;
const CARD_HEIGHT = 168;
const standalone = isStandaloneApp();

export default function HomeReelsSection() {
  const { user } = useAuth();
  const { tracks, lastSyncedAt } = useMusicCatalog();
  const { entries, trackReelsMap } = useMyLibrary();
  const { playTrack } = usePlayer();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError('');

    if (standalone) {
      const resolveTrack = (trackId) =>
        tracks.find((track) => track.id === trackId) ||
        entries.find((entry) => entry.id === trackId) ||
        null;
      setVideos(collectAllLocalReels(entries, trackReelsMap, resolveTrack));
      setLoading(false);
      return;
    }

    const { ensureApiBaseOverrideLoaded } = await import('../../constants/api');
    await ensureApiBaseOverrideLoaded();
    try {
      const all = await fetchAllTrackVersions();
      setVideos(all.filter((item) => item.type === 'video' && item.mediaUrl));
    } catch (err) {
      setVideos([]);
      setError(err.message || 'Контенты недоступны');
    } finally {
      setLoading(false);
    }
  }, [entries, trackReelsMap, tracks]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos, lastSyncedAt]);

  if (loading && !videos.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Reels</Text>
        <ActivityIndicator color="#ffffff" style={styles.loader} />
      </View>
    );
  }

  if (!loading && !videos.length && !error) return null;

  const openReel = (index) => {
    setStartIndex(index);
    setViewerOpen(true);
  };

  const playReelTrack = (baseTrack) => {
    if (!baseTrack) return;
    playTrack(baseTrack, tracks);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Reels</Text>
        <Text style={styles.subtitle}>
          {standalone ? 'Ваши видео к трекам' : 'Видео от слушателей'}
        </Text>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.row}
        >
          {videos.map((item, index) => {
            const baseTrack = resolveTrackForVersion(item, tracks);
            return (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => openReel(index)}
                accessibilityLabel="Смотреть Reels"
              >
                <View style={styles.preview} pointerEvents="none">
                  <ReelCardPreview item={item} suspended={viewerOpen} />
                </View>
                {baseTrack ? (
                  <Pressable
                    style={styles.trackTag}
                    onPress={() => playReelTrack(baseTrack)}
                    accessibilityLabel={`Играть ${baseTrack.title}`}
                  >
                    <Ionicons name="musical-note" size={12} color="#fff" />
                    <Text style={styles.trackTagText} numberOfLines={1}>
                      {baseTrack.title}
                    </Text>
                  </Pressable>
                ) : null}
                <View style={styles.authorTag} pointerEvents="none">
                  <ContentAuthorRow
                    item={item}
                    currentUser={user}
                    variant="onDark"
                    avatarSize={18}
                    textStyle={styles.authorText}
                  />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ContentReelsViewer
        visible={viewerOpen}
        items={videos}
        initialIndex={startIndex}
        currentUser={user}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#9a9a9a',
  },
  loader: {
    marginVertical: 16,
  },
  error: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#c00',
    lineHeight: 17,
  },
  scroll: {
    minHeight: CARD_HEIGHT,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2b2b2b',
    borderWidth: 1,
    borderColor: '#222',
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  trackTag: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    zIndex: 2,
  },
  trackTagText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  authorTag: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    zIndex: 2,
  },
  authorText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
});
