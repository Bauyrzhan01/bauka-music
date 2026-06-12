import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { useMusicCatalog } from '../context/MusicCatalogContext';
import { useAlbums } from '../context/AlbumsContext';
import { loadAuthorProfile } from '../utils/loadAuthorProfile';
import TrackResultItem from '../components/search/TrackResultItem';
import { useOsBack } from '../hooks/useOsBack';
import { resolveAuthorAvatarUrl } from '../utils/resolveServerMediaUrl';
import { pickProfileImage } from '../utils/pickProfileImage';
import { persistImage } from '../utils/persistImage';

function trackCountLabel(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n1 === 1 && n !== 11) return `${count} трек`;
  if (n1 >= 2 && n1 <= 4 && (n < 10 || n >= 20)) return `${count} трека`;
  return `${count} треков`;
}

export default function AuthorProfileScreen({ authorId, authorName, onBack }) {
  useOsBack(onBack);
  const { playTrack, openPlayer, currentTrack } = usePlayer();
  const {
    tracks: catalogTracks,
    isStandalone,
    updateLocalAuthor,
  } = useMusicCatalog();
  const { hasAlbum, addAlbumFromAuthor, removeAlbum } = useAlbums();
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [albumBusy, setAlbumBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const inAlbums = author ? hasAlbum(author.id) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await loadAuthorProfile(
        authorId,
        authorName,
        catalogTracks
      );
      setAuthor(data);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [authorId, authorName, catalogTracks]);

  useEffect(() => {
    load();
  }, [load]);

  const initial = (author?.name || '?').charAt(0).toUpperCase();
  const authorAvatarUri = resolveAuthorAvatarUrl(author);
  const avatarKey = `${authorId}-${authorAvatarUri || 'none'}`;

  const handleAvatarPress = async () => {
    if (!isStandalone || avatarBusy) return;

    Alert.alert('Аватар автора', 'Выберите действие', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выбрать фото',
        onPress: async () => {
          const picked = await pickProfileImage();
          if (!picked.ok) {
            if (picked.error) Alert.alert('Аватар', picked.error);
            return;
          }

          setAvatarBusy(true);
          try {
            const savedUri = await persistImage(picked.uri, 'author-avatars');
            if (!savedUri) {
              Alert.alert('Аватар', 'Не удалось сохранить фото');
              return;
            }

            const result = await updateLocalAuthor(authorId, {
              avatarUri: savedUri,
              name: author?.name || authorName,
            });

            if (!result.ok) {
              Alert.alert('Аватар', result.error || 'Не удалось сохранить');
              return;
            }

            await load();
            Alert.alert('Готово', 'Аватар автора обновлён');
          } catch (err) {
            Alert.alert('Аватар', err.message || 'Не удалось сохранить фото');
          } finally {
            setAvatarBusy(false);
          }
        },
      },
      ...(authorAvatarUri
        ? [
            {
              text: 'Удалить фото',
              style: 'destructive',
              onPress: async () => {
                setAvatarBusy(true);
                try {
                  const result = await updateLocalAuthor(authorId, {
                    avatarUri: null,
                    name: author?.name || authorName,
                  });
                  if (!result.ok) {
                    Alert.alert('Аватар', result.error || 'Не удалось удалить');
                    return;
                  }
                  await load();
                } finally {
                  setAvatarBusy(false);
                }
              },
            },
          ]
        : []),
    ]);
  };

  const handleAlbumPress = async () => {
    if (!author || albumBusy) return;

    if (inAlbums) {
      Alert.alert('Убрать альбом?', 'Исчезнет с главной страницы', [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Убрать',
          style: 'destructive',
          onPress: async () => {
            setAlbumBusy(true);
            await removeAlbum(author.id);
            setAlbumBusy(false);
          },
        },
      ]);
      return;
    }

    if (!author.tracks?.length) {
      Alert.alert('Альбом', 'У автора пока нет треков для альбома');
      return;
    }

    setAlbumBusy(true);
    const result = await addAlbumFromAuthor(author);
    setAlbumBusy(false);

    if (result.ok) {
      Alert.alert('Готово', 'Альбом появился на главной в разделе «Альбомы»');
    } else {
      Alert.alert('Альбом', result.error || 'Не удалось добавить');
    }
  };

  const listHeader = author ? (
    <View style={styles.hero}>
      <Pressable
        style={styles.avatarPress}
        onPress={handleAvatarPress}
        disabled={!isStandalone || avatarBusy}
      >
        {avatarBusy ? (
          <View style={[styles.avatar, styles.avatarBusy]}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : authorAvatarUri ? (
          <Image
            key={avatarKey}
            source={{ uri: authorAvatarUri }}
            style={styles.avatarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={avatarKey}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
        )}
        {isStandalone ? (
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        ) : null}
      </Pressable>
      {isStandalone ? (
        <Text style={styles.avatarHint}>Нажмите на аватар, чтобы добавить фото</Text>
      ) : null}
      <Text style={styles.name}>{author.name || authorName || 'Автор'}</Text>
      {author.bio ? (
        <Text style={styles.bio}>{author.bio}</Text>
      ) : null}
      <Text style={styles.stats}>{trackCountLabel(author.trackCount)}</Text>

      <Pressable
        style={[styles.albumCard, inAlbums && styles.albumCardActive]}
        onPress={handleAlbumPress}
        disabled={albumBusy}
      >
        <View
          style={[
            styles.albumIconWrap,
            inAlbums && styles.albumIconWrapActive,
          ]}
        >
          {albumBusy ? (
            <ActivityIndicator size="small" color={inAlbums ? '#fff' : '#111'} />
          ) : (
            <Ionicons
              name={inAlbums ? 'checkmark-circle' : 'add-circle-outline'}
              size={26}
              color={inAlbums ? '#fff' : '#111'}
            />
          )}
        </View>
        <View style={styles.albumTextWrap}>
          <Text style={styles.albumTitle}>
            {inAlbums ? 'В ваших альбомах' : 'Добавить альбом'}
          </Text>
          <Text style={styles.albumHint}>
            {inAlbums
              ? 'На главной в ряду с «Избранное»'
              : 'Появится на главной рядом с избранным'}
          </Text>
        </View>
        <Ionicons
          name="albums-outline"
          size={22}
          color={inAlbums ? '#4f46e5' : '#999'}
        />
      </Pressable>

      <Text style={styles.sectionTitle}>Музыка</Text>
    </View>
  ) : null;

  const emptyComponent = (
    <View style={styles.empty}>
      <Ionicons name="musical-notes-outline" size={40} color="#666666" />
      <Text style={styles.emptyText}>У этого автора пока нет треков</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle} numberOfLines={1}>
          {author?.name || authorName || 'Автор'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#ffffff" />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={author?.tracks ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyComponent}
          renderItem={({ item }) => (
            <TrackResultItem
              track={item}
              active={currentTrack?.id === item.id}
              onPress={(track) => {
                playTrack(track, author.tracks);
                openPlayer();
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#ffffff',
  },
  loader: {
    marginTop: 48,
  },
  errorBox: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#c00',
    textAlign: 'center',
    fontSize: 14,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2b2b2b',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  avatarPress: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBusy: {
    opacity: 0.85,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#111',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 12,
    color: '#9a9a9a',
    marginBottom: 8,
    textAlign: 'center',
  },
  initial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    color: '#9a9a9a',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  stats: {
    fontSize: 13,
    color: '#9a9a9a',
    marginTop: 8,
  },
  albumCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  albumCardActive: {
    borderColor: '#a5b4fc',
    backgroundColor: '#1a1a1a',
  },
  albumIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumIconWrapActive: {
    backgroundColor: '#2b2b2b',
  },
  albumTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  albumHint: {
    fontSize: 12,
    color: '#9a9a9a',
    lineHeight: 16,
  },
  sectionTitle: {
    alignSelf: 'stretch',
    fontSize: 14,
    fontWeight: '700',
    color: '#9a9a9a',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9a9a9a',
  },
});
