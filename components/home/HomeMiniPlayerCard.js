import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTrackCoverUrl } from '../../hooks/useTrackCoverUrl';
import { formatTime } from '../../utils/formatTime';

const SPOTIFY_GREEN = '#1ED760';

export function getHomeMiniPlayerCardWidth(screenWidth, options = {}) {
  const horizontalPadding = options.horizontalPadding ?? 16;
  const gap = options.gap ?? 10;
  const columns = options.columns ?? 2;
  const available = screenWidth - horizontalPadding * 2 - gap * (columns - 1);
  return Math.floor(available / columns);
}

export default function HomeMiniPlayerCard({
  track,
  width,
  isActive,
  isPlaying,
  positionMillis = 0,
  durationMillis = 0,
  isFavorite,
  onPlay,
  onTogglePlay,
  onToggleFavorite,
  onOpen,
}) {
  const coverUrl = useTrackCoverUrl(track);

  const layout = useMemo(() => {
    const cardWidth = width || 168;
    const compact = cardWidth < 190;
    const padding = compact ? 10 : 12;
    const artSize = Math.min(cardWidth - padding * 2, Math.round(cardWidth * 0.62));

    return {
      cardWidth,
      padding,
      artSize,
      titleSize: compact ? 12 : 13,
      artistSize: compact ? 10 : 11,
      showTime: cardWidth >= 200 && isActive && durationMillis > 0,
      playBtnSize: compact ? 30 : 32,
      ctrlSize: compact ? 26 : 28,
      iconPlay: compact ? 16 : 17,
      iconHeart: compact ? 16 : 17,
    };
  }, [width, isActive, durationMillis]);

  const progress =
    isActive && durationMillis > 0
      ? Math.min(positionMillis / durationMillis, 1)
      : 0;

  const artistLine = track?.artist || 'Tolqyn';

  if (!track) return null;

  return (
    <Pressable
      style={[styles.cardOuter, { width: layout.cardWidth }]}
      onPress={isActive ? onOpen : onPlay}
      accessibilityLabel={`${track.title}, ${artistLine}`}
    >
      <LinearGradient
        colors={['rgba(30, 215, 96, 0.22)', 'rgba(8, 53, 24, 0.98)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.card,
          {
            paddingTop: layout.padding,
            paddingHorizontal: layout.padding,
            paddingBottom: layout.padding,
          },
        ]}
      >
        <View style={styles.glow} pointerEvents="none" />

        <View
          style={[
            styles.artWrap,
            {
              width: layout.artSize,
              height: layout.artSize,
              marginBottom: layout.padding,
            },
          ]}
        >
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.art} contentFit="cover" />
          ) : (
            <View style={[styles.art, styles.artPh]}>
              <Ionicons
                name="musical-notes"
                size={Math.round(layout.artSize * 0.28)}
                color={SPOTIFY_GREEN}
              />
            </View>
          )}
        </View>

        <View style={[styles.meta, { marginBottom: layout.padding - 2 }]}>
          <Text style={[styles.title, { fontSize: layout.titleSize }]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={[styles.artist, { fontSize: layout.artistSize }]} numberOfLines={1}>
            {artistLine}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={[styles.footer, { minHeight: layout.playBtnSize }]}>
          <View style={styles.footerSide}>
            {layout.showTime ? (
              <Text style={styles.time}>
                {formatTime(positionMillis)}
                {' / '}
                {formatTime(durationMillis)}
              </Text>
            ) : null}
          </View>

          <View style={styles.footerCenter} pointerEvents="box-none">
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                if (isActive) onTogglePlay?.();
                else onPlay?.();
              }}
              hitSlop={6}
              style={[
                styles.playBtn,
                {
                  width: layout.playBtnSize,
                  height: layout.playBtnSize,
                  borderRadius: layout.playBtnSize / 2,
                },
              ]}
              accessibilityLabel={isActive && isPlaying ? 'Пауза' : 'Играть'}
            >
              <Ionicons
                name={isActive && isPlaying ? 'pause' : 'play'}
                size={layout.iconPlay}
                color="#000"
                style={!isActive || !isPlaying ? styles.playIconOffset : null}
              />
            </Pressable>
          </View>

          <View style={[styles.footerSide, styles.footerSideRight]}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleFavorite?.();
              }}
              hitSlop={6}
              style={[styles.ctrlBtn, { width: layout.ctrlSize, height: layout.ctrlSize }]}
              accessibilityLabel={isFavorite ? 'Убрать из избранного' : 'В избранное'}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={layout.iconHeart}
                color={isFavorite ? SPOTIFY_GREEN : 'rgba(255,255,255,0.85)'}
              />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardOuter: {},
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  glow: {
    position: 'absolute',
    top: -16,
    left: '15%',
    right: '15%',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(30, 215, 96, 0.15)',
  },
  artWrap: {
    alignSelf: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  art: {
    width: '100%',
    height: '100%',
  },
  artPh: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {},
  title: {
    color: '#fff',
    fontWeight: '700',
  },
  artist: {
    color: 'rgba(255,255,255,0.62)',
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: SPOTIFY_GREEN,
  },
  footer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  footerSideRight: {
    justifyContent: 'flex-end',
  },
  footerCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  time: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  ctrlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOffset: {
    marginLeft: 2,
  },
});
