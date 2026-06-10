import { View, Text, StyleSheet } from 'react-native';
import { useActiveLyricLine } from '../../hooks/useActiveLyricLine';
import { getKaraokePalette } from '../../utils/karaokePalettes';
import KaraokeLineBubbles from './KaraokeLineBubbles';

export default function MiniKaraokeLine({
  lyricsText,
  positionMillis,
  durationMillis,
  lyricsTimings,
  tone = 'onLight',
}) {
  const palette = getKaraokePalette(tone);
  const { activeLine, hasLyrics } = useActiveLyricLine(
    lyricsText,
    positionMillis,
    durationMillis,
    lyricsTimings
  );

  if (!hasLyrics || !activeLine) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.activeBg,
          borderColor: palette.border,
        },
      ]}
    >
      <KaraokeLineBubbles compact tone={tone} />
      <Text
        style={[styles.line, { color: palette.activeText }]}
        numberOfLines={3}
      >
        {activeLine}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  line: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    zIndex: 2,
  },
});
