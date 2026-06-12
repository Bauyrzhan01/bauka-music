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
import { useAuth } from '../../context/AuthContext';
import { useMyLibrary } from '../../context/MyLibraryContext';
import { isStandaloneApp } from '../../constants/standalone';
import { fetchTrackVersions } from '../../api/trackVersionsApi';
import ReelCardPreview from './ReelCardPreview';
import ContentAuthorRow from './ContentAuthorRow';

const CARD_BG = '#282828';

function mapTrackVideos(videos, baseTrack, user) {
  return (videos || []).map((video) => ({
    id: video.id,
    type: 'video',
    title: video.title,
    localUri: video.uri,
    mediaUrl: video.uri,
    baseTrackId: baseTrack.id,
    trackTitle: baseTrack.title,
    userName: user?.name || 'Я',
    userEmail: null,
    createdAt: video.createdAt,
  }));
}

function mapRemoteVideos(items, baseTrack) {
  return (items || []).map((item) => ({
    ...item,
    baseTrackId: baseTrack.id,
    trackTitle: baseTrack.title,
  }));
}

export default function PlayerTrackReelsSection({
  baseTrack,
  onReelsStateChange,
}) {
  const { user } = useAuth();
  const { getVideosForTrack, addVideoToTrack } = useMyLibrary();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const loadVideos = useCallback(async () => {
    if (!baseTrack?.id) return;
    setError('');

    const localVideos = mapTrackVideos(
      getVideosForTrack(baseTrack.id),
      baseTrack,
      user
    );

    if (isStandaloneApp() || baseTrack.isLocalLibrary) {
      setVideos(localVideos);
      setLoading(false);
      return;
    }

    try {
      const list = await fetchTrackVersions(baseTrack.id, baseTrack.filename);
      const remote = mapRemoteVideos(
        list.filter((item) => item.type === 'video' && item.mediaUrl),
        baseTrack
      );
      const seen = new Set(localVideos.map((item) => item.id));
      const merged = [
        ...localVideos,
        ...remote.filter((item) => !seen.has(item.id)),
      ];
      setVideos(merged);
    } catch (err) {
      setVideos(localVideos);
      if (!localVideos.length) {
        setError(err.message || 'Не удалось загрузить Reels');
      }
    } finally {
      setLoading(false);
    }
  }, [
    baseTrack,
    getVideosForTrack,
    user,
  ]);

  useEffect(() => {
    setLoading(true);
    loadVideos();
  }, [loadVideos]);

  const openReels = (index, list = videos) => {
    if (!onReelsStateChange || !list[index]) return;
    onReelsStateChange({
      visible: true,
      items: list,
      initialIndex: index,
    });
  };

  const handleAddReel = async () => {
    if (!baseTrack?.id || adding) return;
    setAdding(true);
    setError('');
    try {
      const result = await addVideoToTrack(baseTrack.id);
      if (result.cancelled) return;
      if (!result.ok) {
        setError(result.error || 'Не удалось добавить видео');
        return;
      }
      await loadVideos();
      const localVideos = mapTrackVideos(
        getVideosForTrack(baseTrack.id),
        baseTrack,
        user
      );
      const newIndex = localVideos.findIndex(
        (item) => item.id === result.video?.id
      );
      if (newIndex >= 0) {
        const merged =
          videos.length > localVideos.length
            ? [
                localVideos[newIndex],
                ...videos.filter((item) => item.id !== result.video?.id),
              ]
            : localVideos;
        setVideos(merged);
        openReels(0, merged);
      }
    } finally {
      setAdding(false);
    }
  };

  if (!baseTrack) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Reels</Text>
        <Pressable
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAddReel}
          disabled={adding}
          accessibilityLabel="Добавить Reels"
        >
          {adding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add" size={18} color="#fff" />
          )}
          <Text style={styles.addBtnText}>Добавить</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={styles.loader} />
      ) : error ? (
        <Text style={styles.empty}>{error}</Text>
      ) : videos.length === 0 ? (
        <Text style={styles.empty}>Пока нет Reels для этого трека</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {videos.map((item, index) => (
            <Pressable
              key={item.id}
              style={styles.reelCard}
              onPress={() => openReels(index)}
              accessibilityLabel="Смотреть Reels"
            >
              <ReelCardPreview item={item} suspended={false} />
              <View style={styles.reelMeta}>
                {baseTrack?.title ? (
                  <Text style={styles.reelTrack} numberOfLines={1}>
                    {baseTrack.title}
                  </Text>
                ) : null}
                <ContentAuthorRow
                  item={item}
                  currentUser={user}
                  variant="onDark"
                  avatarSize={18}
                  textStyle={styles.reelAuthor}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addBtnDisabled: {
    opacity: 0.7,
  },
  loader: {
    marginVertical: 20,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.45)',
  },
  row: {
    gap: 10,
    paddingRight: 4,
  },
  reelCard: {
    width: 108,
    height: 168,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  reelMeta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  reelTrack: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  reelAuthor: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    marginTop: 2,
  },
});
