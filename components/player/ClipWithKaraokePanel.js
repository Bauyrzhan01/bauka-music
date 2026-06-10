import { View, StyleSheet } from 'react-native';
import {
  PLAYER_CLIP_KARAOKE_GAP,
  PLAYER_CLIP_KARAOKE_LINES_HEIGHT,
  PLAYER_CLIP_WITH_KARAOKE_HEIGHT,
} from '../../utils/playerTopLayout';
import VideoClipPanel from './VideoClipPanel';
import KaraokeLyrics from './KaraokeLyrics';

export default function ClipWithKaraokePanel({
  clipUrl,
  active,
  initialPositionSec = 0,
  lyricsText,
  lyricsTimings,
  clipPositionSec = 0,
  onClipProgress,
  tone = 'onLight',
}) {
  if (!active) return null;

  const positionMillis = Math.max(0, Math.round(clipPositionSec * 1000));
  const durationMillis = Math.max(
    positionMillis + 120000,
    ...((lyricsTimings || []).map((t) => Math.round(t * 1000))),
    240000
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.videoSlot}>
        <VideoClipPanel
          clipUrl={clipUrl}
          active
          compact
          compactLarge
          initialPositionSec={initialPositionSec}
          onProgress={onClipProgress}
        />
      </View>
      <View style={styles.karaokeSlot}>
        <KaraokeLyrics
          bounded
          maxLines={2}
          tone={tone}
          lyricsText={lyricsText}
          positionMillis={positionMillis}
          durationMillis={durationMillis}
          lyricsTimings={lyricsTimings}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: PLAYER_CLIP_WITH_KARAOKE_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  videoSlot: {
    width: '100%',
    flexShrink: 0,
  },
  karaokeSlot: {
    marginTop: PLAYER_CLIP_KARAOKE_GAP,
    height: PLAYER_CLIP_KARAOKE_LINES_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
});
