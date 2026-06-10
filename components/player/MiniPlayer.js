import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../../context/PlayerContext';
import { useTrackCoverUrl } from '../../hooks/useTrackCoverUrl';
import { useTrackCoverTheme } from '../../hooks/useTrackCoverTheme';
import { useActiveLyricLine } from '../../hooks/useActiveLyricLine';
import AnimatedPlayerArtwork from './AnimatedPlayerArtwork';
import MiniKaraokeLine from './MiniKaraokeLine';
import FavoriteButton from '../FavoriteButton';

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    positionMillis,
    durationMillis,
    togglePlay,
    openPlayer,
    playNext,
    playPrevious,
  } = usePlayer();

  const { hasLyrics } = useActiveLyricLine(
    currentTrack?.description,
    positionMillis,
    durationMillis,
    currentTrack?.lyricsTimings
  );

  const coverUrl = useTrackCoverUrl(currentTrack);
  const theme = useTrackCoverTheme(coverUrl);

  if (!currentTrack) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.miniBackground,
          borderTopColor: theme.border,
        },
      ]}
    >
      <View style={styles.leftCol}>
        <View style={styles.transportRow}>
          <Pressable
            style={styles.skipBtn}
            onPress={playPrevious}
            hitSlop={8}
            accessibilityLabel="Предыдущий трек"
          >
            <Ionicons name="play-skip-back" size={20} color={theme.textMuted} />
          </Pressable>

          <Pressable
            style={styles.avatarBtn}
            onPress={togglePlay}
            accessibilityLabel={isPlaying ? 'Пауза' : 'Играть'}
          >
            <AnimatedPlayerArtwork
              size="mini"
              isPlaying={isPlaying}
              variant="dark"
              imageUri={coverUrl}
            />
          </Pressable>

          <Pressable
            style={styles.skipBtn}
            onPress={playNext}
            hitSlop={8}
            accessibilityLabel="Следующий трек"
          >
            <Ionicons name="play-skip-forward" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {currentTrack.title}
        </Text>
      </View>

      <Pressable
        style={styles.contentCol}
        onPress={openPlayer}
        accessibilityLabel="Открыть плеер"
      >
        {hasLyrics ? (
          <MiniKaraokeLine
            lyricsText={currentTrack.description}
            positionMillis={positionMillis}
            durationMillis={durationMillis}
            lyricsTimings={currentTrack.lyricsTimings}
            tone={theme.tone}
          />
        ) : (
          <Text style={[styles.artist, { color: theme.textMuted }]} numberOfLines={2}>
            {currentTrack.artist || 'Bauka Music'}
          </Text>
        )}
      </Pressable>

      <View
        style={[
          styles.favoriteCol,
          { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
        ]}
      >
        <FavoriteButton
          trackId={currentTrack.id}
          size={20}
          color={theme.textMuted}
          activeColor={theme.favoriteActive}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    minHeight: 88,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 12,
    gap: 10,
  },
  leftCol: {
    alignItems: 'center',
    width: 118,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  skipBtn: {
    width: 32,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 6,
    width: '100%',
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  artist: {
    fontSize: 14,
    lineHeight: 20,
  },
  favoriteCol: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: 4,
  },
});
