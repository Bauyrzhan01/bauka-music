import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { isStandaloneApp } from '../../constants/standalone';
import { fetchAuthor } from '../../api/authorsApi';
import {
  findAuthorForTrack,
  resolveTrackAuthorId,
} from '../../utils/localAuthors';
import { resolveAuthorAvatarUrl } from '../../utils/resolveServerMediaUrl';

function buildFallbackAuthor(baseTrack, authorId) {
  return {
    id: authorId,
    name: baseTrack?.artist || 'Автор',
    bio: '',
    trackCount: 0,
  };
}

export default function PlayerAuthorSection({
  baseTrack,
  playerTheme,
  onOpenAuthorProfile,
}) {
  const { authors } = useMusicCatalog();
  const authorId = resolveTrackAuthorId(baseTrack);

  const catalogAuthor = useMemo(
    () => findAuthorForTrack(authors, baseTrack),
    [authors, baseTrack?.id, baseTrack?.authorId, baseTrack?.artist]
  );

  const [remoteAuthor, setRemoteAuthor] = useState(null);
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    setRemoteAuthor(null);

    if (
      isStandaloneApp() ||
      !authorId ||
      authorId.startsWith('artist:') ||
      findAuthorForTrack(authors, baseTrack)
    ) {
      setLoadingRemote(false);
      return undefined;
    }

    let cancelled = false;
    setLoadingRemote(true);

    fetchAuthor(authorId)
      .then((data) => {
        if (!cancelled && data) setRemoteAuthor(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingRemote(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authorId, baseTrack?.id, baseTrack?.artist, authors]);

  if (!baseTrack) return null;

  const author =
    catalogAuthor || remoteAuthor || buildFallbackAuthor(baseTrack, authorId);
  const loading = !catalogAuthor && !remoteAuthor && loadingRemote;

  const textColor = playerTheme?.text ?? '#111';
  const mutedColor = playerTheme?.textMuted ?? '#666';
  const isLight = playerTheme?.isLight ?? true;
  const avatarBg = isLight ? '#121212' : 'rgba(255,255,255,0.22)';
  const avatarBorder = isLight ? '#121212' : 'rgba(255,255,255,0.5)';

  const authorAvatarUri = resolveAuthorAvatarUrl(author);
  const initial = (author?.name || '?').charAt(0).toUpperCase();
  const avatarKey = `${baseTrack.id}-${authorId || 'none'}-${authorAvatarUri || initial}`;

  const openProfile = () => {
    if (!authorId || !onOpenAuthorProfile) return;
    onOpenAuthorProfile({
      authorId,
      authorName: author?.name || baseTrack.artist || 'Автор',
    });
  };

  return (
    <View
      key={`author-section-${baseTrack.id}`}
      style={[
        styles.wrap,
        playerTheme && { borderTopColor: playerTheme.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: textColor }]}>Автор</Text>

      {loading ? (
        <ActivityIndicator color={textColor} style={styles.loader} />
      ) : (
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: isLight
                ? 'rgba(0,0,0,0.05)'
                : 'rgba(255,255,255,0.08)',
              borderColor: isLight
                ? 'rgba(0,0,0,0.1)'
                : 'rgba(255,255,255,0.14)',
            },
          ]}
          onPress={openProfile}
          disabled={!authorId || !onOpenAuthorProfile}
        >
          {authorAvatarUri ? (
            <Image
              key={avatarKey}
              source={{ uri: authorAvatarUri }}
              style={[styles.avatar, { borderColor: avatarBorder }]}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={avatarKey}
            />
          ) : (
            <View
              key={avatarKey}
              style={[
                styles.avatar,
                { backgroundColor: avatarBg, borderColor: avatarBorder },
              ]}
            >
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}

          <View style={styles.info}>
            <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
              {author.name || baseTrack?.artist || 'Автор'}
            </Text>
            {author?.bio ? (
              <Text
                style={[styles.bio, { color: mutedColor }]}
                numberOfLines={2}
              >
                {author.bio}
              </Text>
            ) : (
              <Text style={[styles.bio, { color: mutedColor }]}>
                {author?.trackCount
                  ? `${author.trackCount} треков`
                  : 'Музыка автора'}
              </Text>
            )}
            {authorId && onOpenAuthorProfile ? (
              <Text style={[styles.link, { color: mutedColor }]}>
                Профиль автора
              </Text>
            ) : null}
          </View>

          {authorId && onOpenAuthorProfile ? (
            <Ionicons name="chevron-forward" size={22} color={mutedColor} />
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  loader: {
    paddingVertical: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
  },
  link: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
