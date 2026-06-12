import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { usePlayer } from '../../context/PlayerContext';
import { enrichTrackWithCover } from '../../utils/trackCoverUrl';
import { resolveAuthorAvatarUrl } from '../../utils/resolveServerMediaUrl';
import { findAuthorForTrack } from '../../utils/localAuthors';
import CircularFeaturedCarousel from './CircularFeaturedCarousel';

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1628749528992-f5702133b686?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524267213992-b76e8577d046?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
];

const MAX_CAROUSEL_TRACKS = 24;

export default function HomeFeaturedCarouselSection() {
  const { tracks, authors } = useMusicCatalog();
  const { playTrack } = usePlayer();

  const items = useMemo(() => {
    if (!tracks.length) return [];

    return tracks.slice(0, MAX_CAROUSEL_TRACKS).map((track, index) => {
      const enriched = enrichTrackWithCover(track);
      const author = findAuthorForTrack(authors, track);
      const authorAvatar = resolveAuthorAvatarUrl(author);

      return {
        id: track.id,
        track: enriched,
        name: track.title,
        designation: track.artist || author?.name || 'Tolqyn',
        src:
          enriched.coverUrl ||
          authorAvatar ||
          FALLBACK_COVERS[index % FALLBACK_COVERS.length],
      };
    });
  }, [tracks, authors]);

  const playlist = useMemo(
    () => items.map((item) => item.track).filter(Boolean),
    [items]
  );

  if (items.length < 2) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <CircularFeaturedCarousel
          items={items}
          autoplay
          variant="dark"
          colors={{
            name: '#ffffff',
            designation: 'rgba(255,255,255,0.85)',
          }}
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
    marginHorizontal: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#060507',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
