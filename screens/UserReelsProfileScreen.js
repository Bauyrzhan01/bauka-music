import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  deleteTrackVersion,
  fetchAllTrackVersions,
} from '../api/trackVersionsApi';
import { isStandaloneApp } from '../constants/standalone';
import { useMyLibrary } from '../context/MyLibraryContext';
import { collectLocalReels } from '../utils/localReels';
import { useAuth } from '../context/AuthContext';
import { useMusicCatalog } from '../context/MusicCatalogContext';

import { filterMyReels } from '../utils/filterMyReels';
import { resolveTrackForVersion } from '../utils/resolveTrackForVersion';
import { displayContentTitle } from '../utils/displayContentTitle';
import { resolveContentUserAvatar } from '../utils/resolveContentUserAvatar';
import UserAvatarChip from '../components/UserAvatarChip';
import ReelCardPreview from '../components/player/ReelCardPreview';
import ContentReelsViewer from '../components/player/ContentReelsViewer';
import ReelMoreMenu from '../components/profile/ReelMoreMenu';
import { useOsBack } from '../hooks/useOsBack';

const CARD_WIDTH = 108;
const CARD_HEIGHT = 168;

export default function UserReelsProfileScreen({
  userEmail,
  userName,
  userAvatarUrl,
  onBack,
}) {
  useOsBack(onBack);
  const { user: currentUser } = useAuth();
  const { tracks, lastSyncedAt, refreshCatalog } = useMusicCatalog();
  const { entries, removeVideoFromEntry } = useMyLibrary();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const displayName = userName || userEmail?.split('@')[0] || 'Пользователь';
  const isSelf =
    currentUser?.email?.trim().toLowerCase() ===
    userEmail?.trim().toLowerCase();

  const previewItem = {
    userEmail,
    userName: displayName,
    userAvatarUrl,
  };
  const { uri: avatarUri, accentColor } = resolveContentUserAvatar(
    previewItem,
    currentUser
  );

  const loadUserReels = useCallback(async () => {
    setLoading(true);
    setError('');

    if (isStandaloneApp()) {
      setVideos(isSelf ? collectLocalReels(entries) : []);
      setLoading(false);
      return;
    }

    try {
      const { ensureApiBaseOverrideLoaded } = await import('../constants/api');
      await ensureApiBaseOverrideLoaded();
      const all = await fetchAllTrackVersions();
      setVideos(filterMyReels(all, userEmail));
    } catch (err) {
      setVideos([]);
      setError(err.message || 'Не удалось загрузить Reels');
    } finally {
      setLoading(false);
    }
  }, [userEmail, isSelf, entries]);

  useEffect(() => {
    loadUserReels();
  }, [loadUserReels, lastSyncedAt]);

  const openReel = (index) => {
    setStartIndex(index);
    setViewerOpen(true);
  };

  const removeVideo = (id) => {
    setVideos((prev) => {
      const next = prev.filter((v) => v.id !== id);
      if (viewerOpen && next.length === 0) {
        setViewerOpen(false);
      } else if (viewerOpen && startIndex >= next.length) {
        setStartIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const confirmDelete = (item) => {
    if (!isSelf || !currentUser?.email || deletingId) return;

    Alert.alert(
      'Удалить видео',
      'Видео будет удалено с сервера без восстановления.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(item.id);
            try {
              await deleteTrackVersion(item.id, currentUser.email);
              removeVideo(item.id);
              refreshCatalog();
            } catch (err) {
              Alert.alert('Ошибка', err.message || 'Не удалось удалить');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityLabel="Назад" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Профиль</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <UserAvatarChip
            uri={avatarUri}
            name={displayName}
            size={72}
            variant="light"
            accentColor={accentColor}
          />
          <Text style={styles.name}>@{displayName}</Text>
          {userEmail ? (
            <Text style={styles.email}>{userEmail}</Text>
          ) : null}
          {isSelf ? (
            <Text style={styles.selfBadge}>Это ваш профиль</Text>
          ) : null}
          <Text style={styles.stats}>
            {videos.length}{' '}
            {videos.length === 1 ? 'Reels' : 'Reels'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reels</Text>

        {loading ? (
          <ActivityIndicator color="#111" style={styles.loader} />
        ) : null}

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {!loading && !error && videos.length === 0 ? (
          <Text style={styles.empty}>Пока нет видео</Text>
        ) : null}

        {videos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {videos.map((item, index) => {
              const track = resolveTrackForVersion(item, tracks);
              const isDeleting = deletingId === item.id;
              return (
                <View key={item.id} style={styles.cardWrap}>
                  <Pressable
                    style={styles.card}
                    onPress={() => openReel(index)}
                    disabled={isDeleting}
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
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {displayContentTitle(item.title)}
                      </Text>
                    ) : null}
                  </Pressable>
                  {isSelf ? (
                    <ReelMoreMenu
                      onDelete={() => confirmDelete(item)}
                      isDeleting={isDeleting}
                    />
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        ) : null}
      </ScrollView>

      <ContentReelsViewer
        visible={viewerOpen}
        items={videos}
        initialIndex={startIndex}
        currentUser={currentUser}
        allowDeleteOwn={isSelf}
        deletingReelId={deletingId}
        onDeleteItem={confirmDelete}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  selfBadge: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  stats: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  loader: {
    paddingVertical: 24,
  },
  error: {
    paddingHorizontal: 16,
    color: '#c00',
    fontSize: 13,
  },
  empty: {
    paddingHorizontal: 16,
    color: '#888',
    fontSize: 14,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 8,
  },
  cardWrap: {
    position: 'relative',
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
    bottom: 36,
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
});
