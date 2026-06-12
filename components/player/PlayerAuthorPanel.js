import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { loadAuthorProfile } from '../../utils/loadAuthorProfile';

export default function PlayerAuthorPanel({
  baseTrack,
  bounded = false,
  tone = 'onLight',
  textColor = '#111',
  mutedColor = '#999',
}) {
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const authorId =
      baseTrack?.authorId ||
      (baseTrack?.artist ? `artist:${baseTrack.artist}` : null);

    if (!authorId) {
      setAuthor({
        name: baseTrack?.artist || 'Tolqyn',
        bio: '',
      });
      setLoading(false);
      return undefined;
    }

    loadAuthorProfile(authorId, baseTrack.artist || '')
      .then((data) => {
        if (!cancelled) setAuthor(data);
      })
      .catch(() => {
        if (!cancelled) {
          setAuthor({
            name: baseTrack.artist || 'Автор',
            bio: '',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [baseTrack?.id, baseTrack?.authorId, baseTrack?.artist]);

  const centerStyle = [styles.wrapCenter, bounded && styles.wrapBoundedFill];
  const loadingStyle = bounded
    ? [styles.wrapBoundedFill, styles.wrapCenter, styles.scrollContent]
    : [styles.wrap, styles.wrapCenter];

  if (loading) {
    return (
      <View style={loadingStyle}>
        <ActivityIndicator color={textColor} />
      </View>
    );
  }

  const body = (
    <>
      <Text style={[styles.name, { color: textColor }]}>{author?.name}</Text>
      {author?.bio ? (
        <Text style={[styles.bio, { color: tone === 'onDark' ? mutedColor : '#555' }]}>
          {author.bio}
        </Text>
      ) : (
        <Text style={[styles.bioMuted, { color: mutedColor }]}>
          Нет описания автора
        </Text>
      )}
    </>
  );

  if (bounded) {
    return (
      <ScrollView
        style={styles.wrapBoundedFill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {body}
      </ScrollView>
    );
  }

  return <View style={[styles.wrap, styles.wrapCenter]}>{body}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  wrapCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapBoundedFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#9a9a9a',
    textAlign: 'center',
    lineHeight: 20,
  },
  bioMuted: {
    fontSize: 13,
    color: '#9a9a9a',
    textAlign: 'center',
  },
});
