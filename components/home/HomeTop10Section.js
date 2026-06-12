import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { usePlayer } from '../../context/PlayerContext';
import { enrichTrackWithCover } from '../../utils/trackCoverUrl';
import { resolveAuthorAvatarUrl } from '../../utils/resolveServerMediaUrl';
import { findAuthorForTrack } from '../../utils/localAuthors';
import { buildTop10Tracks } from '../../utils/buildTop10Tracks';
import CircularGallery from './CircularGallery';

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524267213992-b76e8577d046?q=80&w=800&auto=format&fit=crop',
];

export default function HomeTop10Section() {
  const { width: screenWidth } = useWindowDimensions();
  const { tracks, authors } = useMusicCatalog();
  const { playTrack } = usePlayer();
  const [topTracks, setTopTracks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    buildTop10Tracks(tracks).then((list) => {
      if (!cancelled) setTopTracks(list);
    });
    return () => {
      cancelled = true;
    };
  }, [tracks]);

  const galleryItems = useMemo(() => {
    if (!topTracks.length) return [];

    return topTracks.map((track, index) => {
      const enriched = enrichTrackWithCover(track);
      const author = findAuthorForTrack(authors, track);
      const authorAvatar = resolveAuthorAvatarUrl(author);
      const artist = track.artist || author?.name || 'Tolqyn';
      const coverUrl =
        enriched.coverUrl ||
        authorAvatar ||
        FALLBACK_COVERS[index % FALLBACK_COVERS.length];

      return {
        id: track.id,
        track: enriched,
        badge: `${index + 1}`,
        common: track.title,
        binomial: artist,
        photo: {
          url: coverUrl,
          text: track.title,
          by: artist,
        },
      };
    });
  }, [topTracks, authors]);

  const playlist = useMemo(
    () => galleryItems.map((item) => item.track).filter(Boolean),
    [galleryItems]
  );

  if (galleryItems.length < 2) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Топ 10</Text>
        <Text style={styles.subtitle}>Свайпните влево или вправо</Text>
      </View>
      <View style={[styles.card, { minHeight: Math.round(screenWidth * 0.78) }]}>
        <CircularGallery
          items={galleryItems}
          radius={Math.round(screenWidth * 0.44)}
          autoRotateSpeed={0.12}
          onItemPress={(item) => {
            if (item.track) {
              playTrack(item.track, playlist);
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: '#9a9a9a',
    fontSize: 12,
  },
  card: {
    marginHorizontal: 4,
    backgroundColor: '#060507',
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'visible',
  },
});
