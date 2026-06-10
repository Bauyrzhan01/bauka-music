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
import { fetchAllTrackVersions } from '../../api/trackVersionsApi';
import { getApiBaseUrl } from '../../constants/api';
import { isStandaloneApp } from '../../constants/standalone';
import { useAuth } from '../../context/AuthContext';
import { useMyLibrary } from '../../context/MyLibraryContext';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { collectLocalReels } from '../../utils/localReels';
import { resolveTrackForVersion } from '../../utils/resolveTrackForVersion';
import { filterMyReels } from '../../utils/filterMyReels';
import { displayContentTitle } from '../../utils/displayContentTitle';
import ReelCardPreview from '../player/ReelCardPreview';
import ContentReelsViewer from '../player/ContentReelsViewer';
import ReelMoreMenu from './ReelMoreMenu';

const CARD_WIDTH = 108;
const CARD_HEIGHT = 168;
const standalone = isStandaloneApp();

export default function ProfileMyReelsSection({ onCountChange, onOpenMain }) {
  const { user } = useAuth();
  const { tracks, lastSyncedAt, refreshCatalog } = useMusicCatalog();
  const { entries, removeVideoFromEntry } = useMyLibrary();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const loadMine = useCallback(async () => {
    setLoading(true);
    setError('');

    if (standalone) {
      setVideos(collectLocalReels(entries));
      setLoading(false);
      return;
    }

    const { ensureApiBaseOverrideLoaded } = await import('../../constants/api');
    await ensureApiBaseOverrideLoaded();
    try {
      const all = await fetchAllTrackVersions();
      const mine = filterMyReels(all, user?.email);
      setVideos(mine);
    } catch (err) {
      setVideos([]);
      setError(err.message || 'Не удалось загрузить Reels');
    } finally {
      setLoading(false);
    }
  }, [user?.email, entries]);

  useEffect(() => {
    loadMine();
  }, [loadMine, lastSyncedAt]);

  useEffect(() => {
    onCountChange?.(videos.length);
  }, [videos.length, onCountChange]);

  const openReel = (index) => {
    setStartIndex(index);
    setViewerOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="videocam" size={18} color="#111" />
          <Text style={styles.title}>Мои Reels</Text>
          {!loading ? (
            <Text style={styles.count}>{videos.length}</Text>
          ) : null}
        </View>
        <Pressable onPress={loadMine} hitSlop={8}>
          <Ionicons name="refresh-outline" size={20} color="#666" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#111" style={styles.loader} />
      ) : null}

      {error ? (
        <Text style={styles.error}>
          {error}
          {!standalone ? `\nAPI: ${getApiBaseUrl()}` : ''}
        </Text>
      ) : null}

      {!loading && !error && videos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="film-outline" size={28} color="#999" />
          <Text style={styles.emptyTitle}>Пока нет ваших видео</Text>
          <Text style={styles.emptyText}>
            {standalone
              ? 'Моя музыка → редактирование трека → «Добавить видео».'
              : 'Откройте трек в плеере → «Контент» → загрузите видео. Удаление: ⋮ на карточке.'}
          </Text>
          {onOpenMain ? (
            <Pressable style={styles.emptyBtn} onPress={onOpenMain}>
              <Text style={styles.emptyBtnText}>На главную</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {videos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {videos.map((item, index) => {
            const track = resolveTrackForVersion(item, tracks);
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
                {track ? (
                  <View style={styles.trackTag} pointerEvents="none">
                    <Ionicons name="musical-note" size={12} color="#fff" />
                    <Text style={styles.trackTagText} numberOfLines={1}>
                      {track.title}
                    </Text>
                  </View>
                ) : null}
                {displayContentTitle(item.title) ? (
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {displayContentTitle(item.title)}
                  </Text>
                ) : (
                  <Text style={styles.cardTitleMuted}>Моё видео</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

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
    marginTop: 4,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  count: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  loader: {
    paddingVertical: 20,
  },
  error: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#c00',
    lineHeight: 18,
    marginBottom: 8,
  },
  emptyBox: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#111',
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#111',
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
  cardTitle: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardTitleMuted: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
});
