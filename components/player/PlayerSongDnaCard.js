import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { getSimilarTracks } from '../../utils/getSimilarTracks';
import { enrichTrackWithCover } from '../../utils/trackCoverUrl';

const CARD_BG = '#282828';

export default function PlayerSongDnaCard({
  baseTrack,
  coverUrl,
  accentGreen = '#1DB954',
  themeAccent = '#7c5cff',
}) {
  const { tracks } = useMusicCatalog();

  const similarCover = useMemo(() => {
    const similar = getSimilarTracks(baseTrack, tracks, 4).map((t) =>
      enrichTrackWithCover(t)
    );
    const withCover = similar.find((t) => t.coverUrl);
    return withCover?.coverUrl || null;
  }, [baseTrack, tracks]);

  const circleSize = 132;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>SongDNA</Text>
        <View style={[styles.badge, { backgroundColor: accentGreen }]}>
          <Text style={styles.badgeText}>Бета-версия</Text>
        </View>
      </View>

      <View style={styles.circles}>
        <View style={[styles.circle, { width: circleSize, height: circleSize }]}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={styles.circleImage}
              contentFit="cover"
              transition={0}
            />
          ) : (
            <LinearGradient
              colors={[themeAccent, '#121212']}
              style={styles.circleImage}
            />
          )}
        </View>

        <View style={[styles.circle, { width: circleSize, height: circleSize }]}>
          {similarCover ? (
            <Image
              source={{ uri: similarCover }}
              style={styles.circleImage}
              contentFit="cover"
              transition={0}
            />
          ) : (
            <LinearGradient
              colors={['#3d5a80', '#e0c3fc', '#f8f9fa']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.circleImage}
            />
          )}
        </View>
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
    paddingTop: 14,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#121212',
  },
  circles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  circle: {
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  circleImage: {
    width: '100%',
    height: '100%',
  },
});
