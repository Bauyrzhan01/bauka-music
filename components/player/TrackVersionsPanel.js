import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { usePlayer } from '../../context/PlayerContext';
import { isStandaloneApp } from '../../constants/standalone';
import { fetchTrackVersions } from '../../api/trackVersionsApi';
import AddTrackVersionModal from './AddTrackVersionModal';
import ContentReelsViewer from './ContentReelsViewer';
import ReelCardPreview from './ReelCardPreview';
import ContentAuthorRow from './ContentAuthorRow';
import { displayContentTitle } from '../../utils/displayContentTitle';

function mapLocalVideos(entry, user) {
  return (entry?.videos || []).map((video) => ({
    id: video.id,
    type: 'video',
    title: video.title,
    localUri: video.uri,
    mediaUrl: video.uri,
    baseTrackId: entry.id,
    trackTitle: entry.title,
    userName: user?.name || 'Я',
    userEmail: null,
    createdAt: video.createdAt,
  }));
}

export default function TrackVersionsPanel({
  baseTrack,
  playerTheme,
  onReelsStateChange,
}) {
  const { user } = useAuth();
  const { getEntryById, addVideoToEntry, entries } = useMyLibrary();
  const { currentTrack, playUserVersion } = usePlayer();

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [reelsVisible, setReelsVisible] = useState(false);
  const [reelsStartIndex, setReelsStartIndex] = useState(0);
  const [activeReelId, setActiveReelId] = useState(null);
  const [addingLocal, setAddingLocal] = useState(false);

  const videoContents = useMemo(
    () => contents.filter((item) => item.type === 'video'),
    [contents]
  );
  const audioContents = useMemo(
    () => contents.filter((item) => item.type !== 'video'),
    [contents]
  );

  const loadVersions = useCallback(async () => {
    if (!baseTrack?.id) return;
    setError('');

    if (baseTrack.isLocalLibrary || isStandaloneApp()) {
      const entry = getEntryById(baseTrack.id);
      setContents(
        baseTrack.isLocalLibrary
          ? mapLocalVideos(entry, user)
          : []
      );
      setLoading(false);
      return;
    }

    try {
      const list = await fetchTrackVersions(baseTrack.id, baseTrack.filename);
      setContents(list);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить контенты');
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [
    baseTrack?.id,
    baseTrack?.filename,
    baseTrack?.isLocalLibrary,
    getEntryById,
    user,
    entries,
  ]);

  useEffect(() => {
    setLoading(true);
    loadVersions();
  }, [loadVersions]);

  const activeAudioId =
    currentTrack?.userVersion?.type !== 'video'
      ? currentTrack?.userVersion?.id
      : null;
  const openReels = (version, videosList = null) => {
    const list = videosList ?? videoContents;
    const index = list.findIndex((item) => item.id === version.id);
    if (index < 0) return;
    setReelsStartIndex(index);
    setActiveReelId(version.id);
    if (onReelsStateChange) {
      onReelsStateChange({ visible: true, items: list, initialIndex: index });
      return;
    }
    setReelsVisible(true);
  };

  const closeReels = () => {
    setReelsVisible(false);
    setActiveReelId(null);
    onReelsStateChange?.(null);
  };

  const canAddOnline =
    user && !baseTrack?.isLocalLibrary && !isStandaloneApp();
  const canAddLocal = baseTrack?.isLocalLibrary && isStandaloneApp();
  const canAdd = canAddOnline || canAddLocal;

  const handleAddLocalReel = async () => {
    if (!baseTrack?.id || addingLocal) return;
    setAddingLocal(true);
    setError('');
    try {
      const result = await addVideoToEntry(baseTrack.id);
      if (result.cancelled) return;
      if (!result.ok) {
        setError(result.error || 'Не удалось добавить видео');
        return;
      }
      const video = result.video;
      const mapped = {
        id: video.id,
        type: 'video',
        title: video.title,
        localUri: video.uri,
        mediaUrl: video.uri,
        userName: user?.name || 'Я',
        userEmail: null,
        createdAt: video.createdAt,
      };
      const nextVideos = [mapped, ...videoContents];
      setContents((prev) => [mapped, ...prev]);
      openReels(mapped, nextVideos);
    } finally {
      setAddingLocal(false);
    }
  };

  const handleContentPress = (item) => {
    if (item.type === 'video') {
      openReels(item);
      return;
    }
    setActiveReelId(null);
    playUserVersion(baseTrack, item);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text
          style={[styles.title, playerTheme && { color: playerTheme.panelTitle }]}
        >
          Контенты
        </Text>
        {canAdd ? (
          <Pressable
            style={[
              styles.addBtn,
              playerTheme && { backgroundColor: playerTheme.addBtnBg },
              addingLocal && styles.addBtnDisabled,
            ]}
            onPress={() => {
              if (canAddLocal) {
                handleAddLocalReel();
                return;
              }
              setShowAdd(true);
            }}
            disabled={addingLocal}
          >
            {addingLocal ? (
              <ActivityIndicator
                size="small"
                color={playerTheme?.addBtnText ?? '#fff'}
              />
            ) : (
              <Ionicons
                name="add"
                size={18}
                color={playerTheme?.addBtnText ?? '#fff'}
              />
            )}
            <Text
              style={[
                styles.addBtnText,
                playerTheme && { color: playerTheme.addBtnText },
              ]}
            >
              {canAddLocal ? 'Рилс' : 'Добавить'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          color={playerTheme?.loader ?? '#111'}
        />
      ) : error ? (
        <Text style={[styles.error, playerTheme && { color: '#ff8a8a' }]}>
          {error}
          {'\n\n'}
          Подсказка: на ноутбуке Ctrl+C → npm start (нужен API v3).
        </Text>
      ) : contents.length === 0 ? (
        <Text style={[styles.empty, playerTheme && { color: playerTheme.panelText }]}>
          {baseTrack?.isLocalLibrary
            ? canAddLocal
              ? 'Пока нет рилсов. Нажмите «Рилс» — выберите видео с телефона.'
              : 'Добавьте видео в «Моя музыка» → редактирование трека.'
            : 'Пока нет контента. Нажмите «Добавить» — видео откроется как рилс, аудио в плеере.'}
        </Text>
      ) : (
        <>
          {videoContents.length > 0 ? (
            <View style={styles.section}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reelsRow}
              >
                {videoContents.map((item) => {
                  const active = activeReelId === item.id && reelsVisible;
                  const reelBorder = playerTheme?.text ?? '#111111';
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.reelCard,
                        {
                          borderWidth: active ? 3 : 2,
                          borderColor: reelBorder,
                        },
                      ]}
                      onPress={() => handleContentPress(item)}
                    >
                      <ReelCardPreview
                        item={item}
                        suspended={reelsVisible}
                      />
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
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {audioContents.length > 0 ? (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionLabel,
                  playerTheme && { color: playerTheme.panelText },
                ]}
              >
                Аудио · edit
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.audioRow}
              >
                {audioContents.map((item) => {
                  const active = activeAudioId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.audioCard,
                        playerTheme && {
                          backgroundColor: playerTheme.surface,
                          borderColor: playerTheme.surfaceBorder,
                        },
                        active && [
                          styles.audioCardActive,
                          playerTheme && {
                            borderColor: playerTheme.text,
                            backgroundColor: playerTheme.isLight
                              ? '#fff'
                              : 'rgba(255,255,255,0.12)',
                          },
                        ],
                      ]}
                      onPress={() => handleContentPress(item)}
                    >
                      <Ionicons
                        name="headset"
                        size={20}
                        color={playerTheme?.text ?? '#111'}
                      />
                      <Text
                        style={[
                          styles.audioTitle,
                          playerTheme && { color: playerTheme.text },
                        ]}
                        numberOfLines={2}
                      >
                        {displayContentTitle(item.title) || 'Аудио'}
                      </Text>
                      <Text
                        style={[
                          styles.audioAuthor,
                          playerTheme && { color: playerTheme.panelText },
                        ]}
                        numberOfLines={1}
                      >
                        {item.userName}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </>
      )}

      {onReelsStateChange ? null : (
        <ContentReelsViewer
          visible={reelsVisible}
          items={videoContents}
          initialIndex={reelsStartIndex}
          baseTrack={baseTrack}
          trackTitle={baseTrack.title}
          currentUser={user}
          onClose={closeReels}
        />
      )}

      <AddTrackVersionModal
        visible={showAdd}
        baseTrack={baseTrack}
        user={user}
        onClose={() => setShowAdd(false)}
        onUploaded={(payload) => {
          const items = (Array.isArray(payload) ? payload : [payload]).filter(
            Boolean
          );
          if (!items.length) return;
          setError('');
          const nextVideos = [
            ...items.filter((item) => item.type === 'video'),
            ...videoContents,
          ];
          setContents((prev) => [...items, ...prev]);
          const firstVideo = items.find((item) => item.type === 'video');
          if (firstVideo) {
            openReels(firstVideo, nextVideos);
          } else {
            playUserVersion(baseTrack, items[0]);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2b2b2b',
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
    marginVertical: 12,
  },
  error: {
    color: '#c00',
    fontSize: 12,
    marginBottom: 8,
  },
  empty: {
    fontSize: 12,
    color: '#9a9a9a',
    lineHeight: 18,
    marginBottom: 4,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9a9a9a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reelsRow: {
    gap: 10,
    paddingRight: 8,
  },
  reelCard: {
    width: 108,
    height: 168,
    borderRadius: 14,
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
    color: '#666666',
    fontSize: 10,
    marginTop: 2,
  },
  audioRow: {
    gap: 10,
    paddingRight: 8,
  },
  audioCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
    gap: 6,
  },
  audioCardActive: {
    borderColor: '#111',
    borderWidth: 2,
    backgroundColor: '#000000',
  },
  audioTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  audioAuthor: {
    fontSize: 11,
    color: '#9a9a9a',
  },
});
