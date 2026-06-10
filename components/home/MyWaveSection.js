import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { useOffline } from '../../context/OfflineContext';
import {
  buildMyWavePlaylist,
  getMyWaveSubtitle,
} from '../../utils/buildMyWavePlaylist';
import { useFavorites } from '../../context/FavoritesContext';
import { loadRecentTrackIds } from '../../storage/recentListensStorage';
import MyWaveVisuals from './MyWaveVisuals';
import { useHomeEntrance } from '../../context/HomeEntranceContext';

const HORIZONTAL_PADDING = 16;

export { HORIZONTAL_PADDING };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MyWaveSection() {
  const { user } = useAuth();
  const { catalogTracks } = useOffline();
  const { favoriteIds, ready: favoritesReady } = useFavorites();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { ready: entranceReady, shouldAnimate } = useHomeEntrance();
  const playlistRef = useRef(null);
  const [recentIds, setRecentIds] = useState([]);

  const trackCount = catalogTracks.length;

  const cardOpacity = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);
  const playScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const decorRotate = useSharedValue(0);

  useEffect(() => {
    if (!entranceReady) return;

    if (!shouldAnimate) {
      cardOpacity.value = 1;
      cardTranslateY.value = 0;
      return;
    }

    cardOpacity.value = 0;
    cardTranslateY.value = 16;
    cardOpacity.value = withTiming(1, { duration: 500 });
    cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 120 });
  }, [entranceReady, shouldAnimate, cardOpacity, cardTranslateY]);

  useEffect(() => {
    loadRecentTrackIds().then(setRecentIds);
  }, [currentTrack?.id]);

  useEffect(() => {
    playlistRef.current = null;
  }, [favoriteIds, recentIds, favoritesReady, currentTrack?.id]);

  useEffect(() => {
    decorRotate.value = withRepeat(
      withTiming(360, { duration: 48000, easing: Easing.linear }),
      -1,
      false
    );
  }, [decorRotate]);

  const waveActive = () => {
    const playlist = playlistRef.current;
    if (!playlist?.length || !currentTrack) return false;
    return playlist.some((track) => track.id === currentTrack.id);
  };

  const isWavePlaying = waveActive() && isPlaying;

  useEffect(() => {
    if (isWavePlaying) {
      playScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
      return () => {
        cancelAnimation(playScale);
        cancelAnimation(pulseOpacity);
      };
    }

    playScale.value = withTiming(1, { duration: 200 });
    pulseOpacity.value = withTiming(1, { duration: 200 });
  }, [isWavePlaying, playScale, pulseOpacity]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const playAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const pulseAnimStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const decorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${decorRotate.value}deg` }],
  }));

  if (trackCount === 0) {
    return null;
  }

  const wavePrefs = {
    favoriteIds: favoritesReady ? favoriteIds : [],
    recentIds,
    catalogTracks,
    seedTrackId: currentTrack?.id || null,
  };

  const smartSubtitle = getMyWaveSubtitle(wavePrefs);

  const ensurePlaylist = () => {
    if (!playlistRef.current?.length) {
      playlistRef.current = buildMyWavePlaylist(wavePrefs);
    }
    return playlistRef.current;
  };

  const handlePress = () => {
    const playlist = ensurePlaylist();
    const active = waveActive();

    if (active) {
      togglePlay();
      return;
    }

    playTrack(playlist[0], playlist);
  };

  const active = waveActive();
  const showPause = active && isPlaying;

  return (
    <View style={styles.container}>
      <AnimatedPressable
        style={[styles.card, cardAnimStyle]}
        onPress={handlePress}
      >
        <MyWaveVisuals isPlaying={isWavePlaying} />

        <Animated.View style={[styles.bgDecor, decorAnimStyle]}>
          <Ionicons name="radio" size={120} color="rgba(255,255,255,0.06)" />
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.labelRow}>
            <Animated.View style={pulseAnimStyle}>
              <Ionicons name="pulse" size={18} color="#a5f3fc" />
            </Animated.View>
            <Text style={styles.label}>Моя волна</Text>
          </View>

          <Text style={styles.subtitle}>
            {smartSubtitle ||
              (user?.name
                ? `${user.name}, ваш микс`
                : 'Бесконечная подборка для вас')}
          </Text>

          <Text style={styles.meta}>
            {trackCount} {trackCount === 1 ? 'трек' : 'треков'}
            {smartSubtitle ? ' · персонально' : ' · случайный порядок'}
          </Text>
        </View>

        <AnimatedPressable
          style={[styles.playBtn, playAnimStyle]}
          onPress={handlePress}
          hitSlop={8}
        >
          <Ionicons
            name={showPause ? 'pause' : 'play'}
            size={28}
            color="#111"
          />
        </AnimatedPressable>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  card: {
    height: 148,
    borderRadius: 14,
    backgroundColor: '#111',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  bgDecor: {
    position: 'absolute',
    right: -20,
    top: -10,
  },
  content: {
    flex: 1,
    paddingRight: 12,
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#d4d4d4',
    lineHeight: 18,
    marginBottom: 6,
  },
  meta: {
    fontSize: 11,
    color: '#888',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
