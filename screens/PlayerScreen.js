import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { useTrackCoverUrl } from '../hooks/useTrackCoverUrl';
import { useTrackCoverTheme } from '../hooks/useTrackCoverTheme';
import { useOsBack } from '../hooks/useOsBack';
import { formatTime } from '../utils/formatTime';
import { parseLyrics } from '../utils/parseLyrics';
import AnimatedPlayerArtwork from '../components/player/AnimatedPlayerArtwork';
import KaraokeLyrics from '../components/player/KaraokeLyrics';
import VideoClipPanel from '../components/player/VideoClipPanel';
import ClipWithKaraokePanel from '../components/player/ClipWithKaraokePanel';
import { getTrackClipUrl, parseClipUrl } from '../utils/parseClipUrl';
import { isStandaloneApp } from '../constants/standalone';
import { sendListeningHeartbeat } from '../api/listeningApi';
import { useAuth } from '../context/AuthContext';
import TrackVersionsPanel from '../components/player/TrackVersionsPanel';
import PlayerAuthorSection from '../components/player/PlayerAuthorSection';
import PlayerSimilarTracksSection from '../components/player/PlayerSimilarTracksSection';
import FavoriteButton from '../components/FavoriteButton';
import MusicEqualizer from '../components/player/MusicEqualizer';
import {
  PLAYER_SCROLL_TOP_HEIGHT,
  PLAYER_CLIP_WITH_KARAOKE_HEIGHT,
} from '../utils/playerTopLayout';

export default function PlayerScreen({ onOpenAuthorProfile }) {
  const {
    currentTrack,
    baseTrack,
    isPlaying,
    positionMillis,
    durationMillis,
    isPlayerOpen,
    closePlayer,
    togglePlay,
    seekTo,
    playNext,
    playPrevious,
    repeatMode,
    cycleRepeatMode,
  } = usePlayer();
  const { user } = useAuth();

  const [progressWidth, setProgressWidth] = useState(0);
  const [showKaraoke, setShowKaraoke] = useState(false);
  const [showClip, setShowClip] = useState(false);
  const [clipPositionSec, setClipPositionSec] = useState(0);
  const [clipInitialSec, setClipInitialSec] = useState(0);

  const coverUrl = useTrackCoverUrl(currentTrack);
  const theme = useTrackCoverTheme(coverUrl);

  useOsBack(closePlayer, isPlayerOpen);

  const lyricLines = currentTrack
    ? parseLyrics(currentTrack.description)
    : [];
  const hasLyrics = lyricLines.length > 0;
  const hasKaraokeSync =
    hasLyrics &&
    currentTrack?.lyricsTimings?.length === lyricLines.length &&
    currentTrack.lyricsTimings.every((v) => typeof v === 'number');

  const trackClipUrl = getTrackClipUrl(baseTrack);
  const hasClip = !!parseClipUrl(trackClipUrl);
  const clipWithKaraoke = showClip && hasClip && hasKaraokeSync;

  useEffect(() => {
    if (!isPlayerOpen || !baseTrack?.id) return;
    setShowKaraoke(false);
    setShowClip(false);
    setClipPositionSec(0);
    setClipInitialSec(0);
  }, [isPlayerOpen, baseTrack?.id]);

  if (!currentTrack || !baseTrack) return null;

  const versionActive =
    !!currentTrack.userVersion && currentTrack.userVersion.type !== 'video';

  const progress =
    durationMillis > 0 ? Math.min(positionMillis / durationMillis, 1) : 0;

  const handleSeek = (locationX) => {
    if (!durationMillis || !progressWidth) return;
    const ratio = Math.max(0, Math.min(locationX / progressWidth, 1));
    seekTo(ratio * durationMillis);
  };

  const syncClipProgressToTrack = async () => {
    const ms = Math.max(0, Math.round(clipPositionSec * 1000));
    const capped =
      durationMillis > 0 ? Math.min(ms, durationMillis) : ms;
    if (capped > 0) {
      await seekTo(capped);
    }
  };

  const syncTrackProgressToClip = () => {
    const sec = Math.max(0, positionMillis / 1000);
    setClipInitialSec(sec);
    setClipPositionSec(sec);
  };

  const toggleKaraoke = async () => {
    if (!hasLyrics) return;
    if (showClip) {
      await syncClipProgressToTrack();
    }
    setShowClip(false);
    setShowKaraoke((on) => !on);
  };

  const toggleClip = async () => {
    if (!hasClip) return;
    const next = !showClip;
    if (next) {
      syncTrackProgressToClip();
      if (isPlaying) {
        togglePlay();
      }
      setShowKaraoke(false);
      setShowClip(true);
      if (!isStandaloneApp()) {
        sendListeningHeartbeat({
          userEmail: user?.email,
          userName: user?.name,
          trackId: baseTrack.id,
          authorId: baseTrack.authorId,
          clipOpen: true,
          screen: 'player',
          isPlaying: false,
        });
      }
      return;
    }
    await syncClipProgressToTrack();
    setShowClip(false);
  };

  const headerLabel =
    clipWithKaraoke
      ? 'Клип + караоке'
      : showClip && hasClip
      ? 'Клип'
      : showKaraoke && hasLyrics
        ? 'Караоке'
        : 'Сейчас играет';

  const topMode =
    showClip && hasClip
      ? 'clip'
      : showKaraoke && hasLyrics
        ? 'karaoke'
        : 'track';

  return (
    <Modal
      visible={isPlayerOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closePlayer}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: theme.textMuted }]}>
            {headerLabel}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.scrollTop,
              clipWithKaraoke && {
                height: PLAYER_CLIP_WITH_KARAOKE_HEIGHT,
              },
            ]}
          >
            <Animated.View
              key={topMode}
              entering={FadeIn.duration(320)}
              exiting={FadeOut.duration(260)}
              style={
                topMode !== 'track' ? styles.topSlot : styles.trackTop
              }
            >
              {clipWithKaraoke ? (
                <ClipWithKaraokePanel
                  clipUrl={trackClipUrl}
                  active
                  initialPositionSec={clipInitialSec}
                  lyricsText={currentTrack.description}
                  lyricsTimings={currentTrack.lyricsTimings}
                  clipPositionSec={clipPositionSec}
                  onClipProgress={setClipPositionSec}
                  tone={theme.tone}
                />
              ) : topMode === 'clip' ? (
                <VideoClipPanel
                  clipUrl={trackClipUrl}
                  active
                  initialPositionSec={clipInitialSec}
                  onProgress={setClipPositionSec}
                />
              ) : topMode === 'karaoke' ? (
                <KaraokeLyrics
                  bounded
                  tone={theme.tone}
                  lyricsText={currentTrack.description}
                  positionMillis={positionMillis}
                  durationMillis={durationMillis}
                  lyricsTimings={currentTrack.lyricsTimings}
                />
              ) : (
                <>
                  <View style={styles.artworkWrap}>
                    <AnimatedPlayerArtwork
                      size="large"
                      isPlaying={isPlaying}
                      imageUri={coverUrl}
                      variant={theme.artworkVariant}
                    />
                  </View>
                  <Text
                    style={[styles.title, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {versionActive
                      ? currentTrack.versionLabel || currentTrack.title
                      : currentTrack.title}
                  </Text>
                  <Text
                    style={[styles.artist, { color: theme.textMuted }]}
                    numberOfLines={1}
                  >
                    {versionActive
                      ? `@${currentTrack.versionAuthor || 'user'} · ${baseTrack.title}`
                      : currentTrack.artist || 'Bauka Music'}
                  </Text>
                </>
              )}
            </Animated.View>
          </View>

          <View style={styles.progressBlock}>
            <Pressable
              style={[styles.eqProgress, { backgroundColor: theme.progressBg }]}
              onLayout={(event) =>
                setProgressWidth(event.nativeEvent.layout.width)
              }
              onPress={(event) =>
                handleSeek(event.nativeEvent.locationX)
              }
            >
              <MusicEqualizer
                isPlaying={isPlaying}
                progress={progress}
                barCount={52}
                height={26}
                variant={theme.eqVariant}
                spread
              />
            </Pressable>

            <View style={styles.timeRow}>
              <Text style={[styles.time, { color: theme.textMuted }]}>
                {formatTime(positionMillis)}
              </Text>
              <Text style={[styles.time, { color: theme.textMuted }]}>
                {formatTime(durationMillis)}
              </Text>
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.sideGroup}>
              <Pressable
                style={styles.repeatBtn}
                onPress={cycleRepeatMode}
                accessibilityLabel={
                  repeatMode === 'one'
                    ? 'Повтор одного трека'
                    : repeatMode === 'all'
                      ? 'Повтор плейлиста'
                      : 'Повтор выключен'
                }
              >
                <Ionicons
                  name={repeatMode === 'off' ? 'repeat-outline' : 'repeat'}
                  size={22}
                  color={
                    repeatMode === 'off' ? theme.textMuted : theme.icon
                  }
                />
                {repeatMode === 'one' ? (
                  <Text style={[styles.repeatOne, { color: theme.icon }]}>
                    1
                  </Text>
                ) : null}
              </Pressable>
              <View style={styles.favWrap}>
                <FavoriteButton
                  trackId={baseTrack.id}
                  size={24}
                  color={theme.textMuted}
                  activeColor={theme.favoriteActive}
                />
              </View>
              <Pressable style={styles.controlBtn} onPress={playPrevious}>
                <Ionicons name="play-skip-back" size={28} color={theme.icon} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.playBtn, { backgroundColor: theme.playBtn }]}
              onPress={togglePlay}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={36}
                color={theme.playIcon}
              />
            </Pressable>

            <View style={styles.sideGroup}>
              <Pressable style={styles.controlBtn} onPress={playNext}>
                <Ionicons name="play-skip-forward" size={28} color={theme.icon} />
              </Pressable>
              {hasClip ? (
                <Pressable
                  style={[
                    styles.controlBtn,
                    styles.modeBtn,
                    { backgroundColor: theme.modeBtn },
                    showClip && {
                      backgroundColor: theme.modeBtnActive,
                    },
                  ]}
                  onPress={toggleClip}
                  accessibilityLabel={
                    showClip ? 'Скрыть клип' : 'Показать клип YouTube'
                  }
                >
                  <Ionicons
                    name="videocam"
                    size={22}
                    color={showClip ? theme.modeIconActive : theme.modeIcon}
                  />
                </Pressable>
              ) : null}
              {hasLyrics ? (
                <Pressable
                  style={[
                    styles.controlBtn,
                    styles.modeBtn,
                    { backgroundColor: theme.modeBtn },
                    showKaraoke && {
                      backgroundColor: theme.modeBtnActive,
                    },
                  ]}
                  onPress={toggleKaraoke}
                  accessibilityLabel={
                    showKaraoke ? 'Вернуть обложку' : 'Показать караоке'
                  }
                >
                  <Ionicons
                    name="mic"
                    size={22}
                    color={showKaraoke ? theme.modeIconActive : theme.modeIcon}
                  />
                </Pressable>
              ) : !hasClip ? (
                <View style={styles.controlBtn} />
              ) : null}
            </View>
          </View>

          <View style={[styles.versionsSection, { borderTopColor: theme.border }]}>
            <TrackVersionsPanel baseTrack={baseTrack} playerTheme={theme} />
          </View>

          <PlayerAuthorSection
            key={baseTrack.id}
            baseTrack={baseTrack}
            playerTheme={theme}
            onOpenAuthorProfile={onOpenAuthorProfile}
          />

          <PlayerSimilarTracksSection
            baseTrack={baseTrack}
            playerTheme={theme}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  scrollTop: {
    alignItems: 'center',
    justifyContent: 'center',
    height: PLAYER_SCROLL_TOP_HEIGHT,
    marginBottom: 8,
    overflow: 'hidden',
  },
  trackTop: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSlot: {
    width: '100%',
    height: PLAYER_SCROLL_TOP_HEIGHT,
    overflow: 'hidden',
  },
  artworkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.85 }],
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  artist: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },

  versionsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  progressBlock: {
    marginTop: 8,
    marginBottom: 12,
  },
  eqProgress: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    minHeight: 38,
    justifyContent: 'flex-end',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  time: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repeatBtn: {
    width: 40,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  repeatOne: {
    position: 'absolute',
    right: 4,
    bottom: 12,
    fontSize: 10,
    fontWeight: '800',
  },
  favWrap: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtn: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtn: {
    borderRadius: 24,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
