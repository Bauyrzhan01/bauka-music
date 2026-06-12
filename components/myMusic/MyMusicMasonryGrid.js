import { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { enrichTrackWithCover } from '../../utils/trackCoverUrl';
import { localLibraryEntryToTrack } from '../../utils/localLibraryToTrack';

const GAP = 10;
const HEIGHT_RATIOS = [1.35, 1.05, 1.25, 0.92, 1.15, 1.4, 1.0, 1.3];

function MasonryCard({
  entry,
  width,
  height,
  active,
  onPress,
  onLongPress,
  index,
}) {
  const track = entry._favoriteTrack
    ? enrichTrackWithCover(entry._favoriteTrack)
    : enrichTrackWithCover(localLibraryEntryToTrack(entry));
  const coverUrl = track?.coverUrl;
  const title = entry.title || 'Без названия';
  const artist = entry.artist || (entry._favoriteTrack ? 'Tolqyn' : 'Я');

  return (
    <Animated.View entering={FadeInDown.duration(420).delay(index * 45)}>
      <Pressable
        style={[styles.card, { width, height }, active && styles.cardActive]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="musical-note" size={28} color="rgba(255,255,255,0.4)" />
          </View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.25)', 'transparent']}
          style={styles.gradient}
        />

        <View style={styles.cardTop}>
          <View style={styles.avatarWrap}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPh}>
                <Text style={styles.avatarLetter}>{artist.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.artist} numberOfLines={1}>
            {artist}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>

        {active ? (
          <View style={styles.playingBadge}>
            <Ionicons name="volume-medium" size={14} color="#fff" />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function distributeColumns(entries, columnCount) {
  const columns = Array.from({ length: columnCount }, () => []);
  const heights = Array(columnCount).fill(0);

  entries.forEach((entry, index) => {
    const targetCol = heights.indexOf(Math.min(...heights));
    const ratio = HEIGHT_RATIOS[index % HEIGHT_RATIOS.length];
    columns[targetCol].push({ entry, ratio, index });
    heights[targetCol] += ratio;
  });

  return columns;
}

export default function MyMusicMasonryGrid({
  entries,
  currentTrackId,
  isPlaying,
  onPress,
  onLongPress,
  columns = 2,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const columnWidth = Math.floor(
    (screenWidth - 32 - GAP * (columns - 1)) / columns
  );

  const masonryColumns = useMemo(
    () => distributeColumns(entries, columns),
    [entries, columns]
  );

  return (
    <View style={styles.grid}>
      {masonryColumns.map((column, colIndex) => (
        <View key={`col-${colIndex}`} style={[styles.column, { width: columnWidth }]}>
          {column.map(({ entry, ratio, index }) => (
            <MasonryCard
              key={entry.id}
              entry={entry}
              width={columnWidth}
              height={Math.round(columnWidth * ratio)}
              index={index}
              active={currentTrackId === entry.id && isPlaying}
              onPress={() => onPress?.(entry)}
              onLongPress={() => onLongPress?.(entry)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: GAP,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  column: {
    gap: GAP,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#0582CA',
  },
  coverPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  avatar: {
    width: 28,
    height: 28,
  },
  avatarPh: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  artist: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    position: 'absolute',
    top: 46,
    left: 10,
    right: 10,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  playingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(5,130,202,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
