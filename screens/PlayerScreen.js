import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { useTrackCoverUrl } from '../hooks/useTrackCoverUrl';
import { useTrackCoverTheme } from '../hooks/useTrackCoverTheme';
import { useOsBack } from '../hooks/useOsBack';
import { parseLyrics, getActiveLyricIndex } from '../utils/parseLyrics';
import KaraokeLyrics from '../components/player/KaraokeLyrics';
import VideoClipPanel from '../components/player/VideoClipPanel';
import ClipWithKaraokePanel from '../components/player/ClipWithKaraokePanel';
import { getTrackClipUrl, parseClipUrl } from '../utils/parseClipUrl';
import { isStandaloneApp } from '../constants/standalone';
import { sendListeningHeartbeat } from '../api/listeningApi';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import TrackVersionsPanel from '../components/player/TrackVersionsPanel';
import ContentReelsViewer from '../components/player/ContentReelsViewer';
import PlayerAuthorSection from '../components/player/PlayerAuthorSection';
import PlayerSimilarTracksSection from '../components/player/PlayerSimilarTracksSection';
import PlayerLyricsCard from '../components/player/PlayerLyricsCard';
import PlayerTrackReelsSection from '../components/player/PlayerTrackReelsSection';
import PlayerCoverCarousel from '../components/player/PlayerCoverCarousel';
import PlayerProgressBar from '../components/player/PlayerProgressBar';
import PlayerVolumeOverlay from '../components/player/PlayerVolumeOverlay';
import { PLAYER_CLIP_WITH_KARAOKE_HEIGHT } from '../utils/playerTopLayout';

const SPOTIFY_GREEN = '#1DB954';

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
    volume,
    setVolume,
    isVideoPlayback,
  } = usePlayer();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { width: screenWidth } = useWindowDimensions();

  const [showKaraoke, setShowKaraoke] = useState(false);
  const [showClip, setShowClip] = useState(false);
  const [clipPositionSec, setClipPositionSec] = useState(0);
  const [clipInitialSec, setClipInitialSec] = useState(0);
  const [reelsState, setReelsState] = useState(null);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  const coverUrl = useTrackCoverUrl(currentTrack);
  const theme = useTrackCoverTheme(coverUrl);
  const bgColor = theme.spotifyBg || theme.background;
  const accentGreen = theme.spotifyGreen || SPOTIFY_GREEN;

  const artSize = Math.min(screenWidth - 48, 340);

  const handleOsBack = () => {
    if (showVolume) {
      setShowVolume(false);
      return;
    }
    closePlayer();
  };

  useOsBack(handleOsBack, isPlayerOpen);

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
    setReelsState(null);
    setShowExtras(false);
    setLyricsExpanded(false);
    setShowVolume(false);
  }, [isPlayerOpen, baseTrack?.id]);

  if (!currentTrack || !baseTrack) return null;

  const versionActive =
    !!currentTrack.userVersion && currentTrack.userVersion.type !== 'video';

  const title = versionActive
    ? currentTrack.versionLabel || currentTrack.title
    : currentTrack.title;

  const artist = versionActive
    ? `@${currentTrack.versionAuthor || 'user'} · ${baseTrack.title}`
    : currentTrack.artist || 'Tolqyn';

  const activeLyricIndex = getActiveLyricIndex(
    lyricLines,
    positionMillis,
    durationMillis,
    currentTrack.lyricsTimings
  );
  const lyricPreview = lyricLines[activeLyricIndex] || lyricLines[0] || null;

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

  const openMenu = () => {
    const options = [];
    if (hasClip) {
      options.push({
        text: showClip ? 'Скрыть клип' : 'Клип YouTube',
        onPress: toggleClip,
      });
    }
    if (hasLyrics) {
      options.push({
        text: showKaraoke ? 'Скрыть текст' : 'Текст песни',
        onPress: toggleKaraoke,
      });
    }
    options.push({
      text: showExtras ? 'Скрыть контенты' : 'Контенты и похожее',
      onPress: () => setShowExtras((v) => !v),
    });
    options.push({ text: 'Отмена', style: 'cancel' });

    Alert.alert('Ещё', undefined, options);
  };

  const topMode =
    showClip && hasClip
      ? 'clip'
      : showKaraoke && hasLyrics
        ? 'karaoke'
        : 'track';

  const favorited = isFavorite(baseTrack.id);

  const renderCover = () => {
    if (clipWithKaraoke) {
      return (
        <View style={[styles.mediaSlot, { height: PLAYER_CLIP_WITH_KARAOKE_HEIGHT }]}>
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
        </View>
      );
    }
    if (topMode === 'clip') {
      return (
        <View style={[styles.mediaSlot, { width: artSize, height: artSize * 0.56 }]}>
          <VideoClipPanel
            clipUrl={trackClipUrl}
            active
            initialPositionSec={clipInitialSec}
            onProgress={setClipPositionSec}
          />
        </View>
      );
    }
    if (topMode === 'karaoke') {
      return (
        <View style={[styles.mediaSlot, { width: artSize, minHeight: artSize * 0.55 }]}>
          <KaraokeLyrics
            bounded
            tone={theme.tone}
            lyricsText={currentTrack.description}
            positionMillis={positionMillis}
            durationMillis={durationMillis}
            lyricsTimings={currentTrack.lyricsTimings}
          />
        </View>
      );
    }

    return (
      <View style={[styles.coverSlot, { width: screenWidth }]}>
        <PlayerCoverCarousel
          baseTrack={baseTrack}
          coverUrl={coverUrl}
          artSize={artSize}
          screenWidth={screenWidth}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={isPlayerOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closePlayer}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Pressable
              style={styles.headerBtn}
              onPress={closePlayer}
              accessibilityLabel="Свернуть плеер"
            >
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>СЕЙЧАС ИГРАЕТ</Text>
            </View>

            <Pressable
              style={styles.headerBtn}
              onPress={openMenu}
              accessibilityLabel="Меню"
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.main}>
              {renderCover()}

              {topMode === 'track' && lyricPreview ? (
                <Text style={styles.lyricPreview} numberOfLines={2}>
                  {lyricPreview}
                </Text>
              ) : null}

              <View style={styles.trackRow}>
                <View style={styles.trackMeta}>
                  <Text style={styles.trackTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={2}>
                    {artist}
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggleFavorite(baseTrack.id)}
                  hitSlop={12}
                  accessibilityLabel={
                    favorited ? 'Убрать из избранного' : 'В избранное'
                  }
                >
                  <Ionicons
                    name={favorited ? 'checkmark-circle' : 'ellipse-outline'}
                    size={28}
                    color={favorited ? accentGreen : 'rgba(255,255,255,0.55)'}
                  />
                </Pressable>
              </View>

              <PlayerProgressBar
                positionMillis={positionMillis}
                durationMillis={durationMillis}
                onSeek={seekTo}
              />

              <View style={styles.controls}>
                <Pressable
                  style={styles.controlSide}
                  onPress={() => setShuffleOn((v) => !v)}
                  accessibilityLabel="Перемешать"
                >
                  <Ionicons
                    name="shuffle"
                    size={24}
                    color={shuffleOn ? accentGreen : '#fff'}
                  />
                </Pressable>

                <Pressable
                  style={styles.controlSide}
                  onPress={playPrevious}
                  accessibilityLabel="Предыдущий"
                >
                  <Ionicons name="play-skip-back" size={32} color="#fff" />
                </Pressable>

                <Pressable
                  style={styles.playBtn}
                  onPress={togglePlay}
                  accessibilityLabel={isPlaying ? 'Пауза' : 'Играть'}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={34}
                    color="#121212"
                    style={!isPlaying && styles.playIconOffset}
                  />
                </Pressable>

                <Pressable
                  style={styles.controlSide}
                  onPress={playNext}
                  accessibilityLabel="Следующий"
                >
                  <Ionicons name="play-skip-forward" size={32} color="#fff" />
                </Pressable>

                <View style={styles.controlPair}>
                  {!isVideoPlayback ? (
                    <Pressable
                      style={styles.controlSide}
                      onPress={() => setShowVolume(true)}
                      accessibilityLabel="Громкость"
                    >
                      <Ionicons
                        name={
                          volume <= 0.01
                            ? 'volume-mute'
                            : volume < 0.5
                              ? 'volume-low'
                              : 'volume-high'
                        }
                        size={24}
                        color="#fff"
                      />
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={styles.controlSide}
                    onPress={cycleRepeatMode}
                    accessibilityLabel="Повтор"
                  >
                    <Ionicons
                      name={repeatMode === 'off' ? 'repeat' : 'repeat'}
                      size={24}
                      color={repeatMode === 'off' ? '#fff' : accentGreen}
                    />
                    {repeatMode === 'one' ? (
                      <Text style={[styles.repeatOne, { color: accentGreen }]}>
                        1
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              </View>
            </View>

            <PlayerLyricsCard
              lyricsText={currentTrack.description}
              positionMillis={positionMillis}
              durationMillis={durationMillis}
              lyricsTimings={currentTrack.lyricsTimings}
              onExpand={() => {
                if (!hasLyrics) return;
                setLyricsExpanded(true);
              }}
            />

            <PlayerTrackReelsSection
              baseTrack={baseTrack}
              onReelsStateChange={setReelsState}
            />

            {showExtras ? (
              <View style={styles.extras}>
                <View
                  style={[
                    styles.versionsSection,
                    { borderTopColor: 'rgba(255,255,255,0.12)' },
                  ]}
                >
                  <TrackVersionsPanel
                    baseTrack={baseTrack}
                    playerTheme={theme}
                    onReelsStateChange={setReelsState}
                  />
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
              </View>
            ) : null}
          </ScrollView>

          <Modal
            visible={lyricsExpanded}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setLyricsExpanded(false)}
          >
            <View style={[styles.lyricsModal, { backgroundColor: bgColor }]}>
              <SafeAreaView style={styles.lyricsModalSafe} edges={['top', 'bottom']}>
                <View style={styles.lyricsModalHeader}>
                  <Pressable
                    onPress={() => setLyricsExpanded(false)}
                    style={styles.headerBtn}
                  >
                    <Ionicons name="chevron-down" size={28} color="#fff" />
                  </Pressable>
                  <Text style={styles.lyricsModalTitle}>Текст</Text>
                  <View style={styles.headerBtn} />
                </View>
                <KaraokeLyrics
                  lyricsText={currentTrack.description}
                  positionMillis={positionMillis}
                  durationMillis={durationMillis}
                  lyricsTimings={currentTrack.lyricsTimings}
                  tone="onDark"
                />
              </SafeAreaView>
            </View>
          </Modal>

          {!isVideoPlayback ? (
            <PlayerVolumeOverlay
              visible={showVolume}
              value={volume}
              onValueChange={setVolume}
              onClose={() => setShowVolume(false)}
              accentColor={accentGreen}
            />
          ) : null}

          {reelsState?.visible ? (
            <ContentReelsViewer
              visible
              presentation="overlay"
              items={reelsState.items}
              initialIndex={reelsState.initialIndex}
              baseTrack={baseTrack}
              trackTitle={baseTrack.title}
              currentUser={user}
              onClose={() => setReelsState(null)}
            />
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  headerBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  main: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  coverSlot: {
    alignSelf: 'center',
    marginHorizontal: -24,
    marginBottom: 20,
  },
  mediaSlot: {
    alignSelf: 'center',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  artwork: {
    alignSelf: 'center',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  lyricPreview: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 16,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  trackMeta: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 28,
  },
  trackArtist: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.62)',
    marginTop: 4,
    lineHeight: 20,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  controlSide: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  controlPair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOffset: {
    marginLeft: 4,
  },
  repeatOne: {
    position: 'absolute',
    right: 8,
    bottom: 10,
    fontSize: 9,
    fontWeight: '800',
  },
  lyricsModal: {
    flex: 1,
  },
  lyricsModalSafe: {
    flex: 1,
  },
  lyricsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  lyricsModalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  extras: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  versionsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
