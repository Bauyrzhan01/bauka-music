import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useFavorites } from '../../context/FavoritesContext';
import { useOffline } from '../../context/OfflineContext';
import { usePlayer } from '../../context/PlayerContext';
import { buildMyWavePlaylist } from '../../utils/buildMyWavePlaylist';
import { loadRecentTrackIds } from '../../storage/recentListensStorage';

function QuickPickPill({ title, subtitle, avatars, onPress }) {
  return (
    <Pressable style={styles.pill} onPress={onPress}>
      <View style={styles.avatars}>
        {avatars.slice(0, 2).map((uri, index) =>
          uri ? (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              style={[styles.avatar, index > 0 && styles.avatarOverlap]}
              contentFit="cover"
            />
          ) : (
            <View
              key={`ph-${index}`}
              style={[styles.avatar, styles.avatarPh, index > 0 && styles.avatarOverlap]}
            >
              <Text style={styles.avatarLetter}>♪</Text>
            </View>
          )
        )}
      </View>
      <View style={styles.pillText}>
        <Text style={styles.pillTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.pillSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeForYouSection() {
  const { favoriteIds } = useFavorites();
  const { catalogTracks } = useOffline();
  const { playTrack } = usePlayer();
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    loadRecentTrackIds().then(setRecentIds);
  }, []);

  const items = useMemo(() => {
    const waveTracks = buildMyWavePlaylist({
      favoriteIds,
      recentIds,
      catalogTracks,
      seedTrackId: null,
    });

    if (!waveTracks.length) return [];

    const names = waveTracks
      .slice(0, 2)
      .map((t) => t.artist || t.title)
      .join(', ');

    return [
      {
        id: 'for-you',
        title: 'Для вас',
        subtitle: names || 'Персональный микс',
        avatars: waveTracks.map((t) => t.coverUrl).filter(Boolean),
        tracks: waveTracks,
      },
    ];
  }, [favoriteIds, recentIds, catalogTracks]);

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item) => (
          <QuickPickPill
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            avatars={item.avatars}
            onPress={() => {
              if (item.tracks?.length) {
                playTrack(item.tracks[0], item.tracks);
              }
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 28,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 18,
    minWidth: 200,
    maxWidth: 268,
    gap: 10,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#444',
  },
  avatarOverlap: {
    marginLeft: -16,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  avatarPh: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 14,
  },
  pillText: {
    flexShrink: 1,
    minWidth: 0,
  },
  pillTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pillSubtitle: {
    color: '#9a9a9a',
    fontSize: 12,
    marginTop: 2,
  },
});
