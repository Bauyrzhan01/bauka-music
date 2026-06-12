import { View, Text, Pressable, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveLyricLine } from '../../hooks/useActiveLyricLine';

const CARD_BG = '#282828';

export default function PlayerLyricsCard({
  lyricsText,
  positionMillis,
  durationMillis,
  lyricsTimings,
  onExpand,
}) {
  const { lines, activeIndex, hasLyrics } = useActiveLyricLine(
    lyricsText,
    positionMillis,
    durationMillis,
    lyricsTimings
  );

  const handleShare = async () => {
    if (!lines.length) return;
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // cancelled
    }
  };

  const windowStart = Math.max(0, activeIndex - 1);
  const windowEnd = Math.min(lines.length, activeIndex + 4);
  const visibleLines = lines.slice(windowStart, windowEnd);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Текст</Text>
        <View style={styles.tools}>
          <Pressable style={styles.toolBtn} hitSlop={6} accessibilityLabel="Перевод">
            <Ionicons name="language-outline" size={18} color="#fff" />
          </Pressable>
          <Pressable
            style={styles.toolBtn}
            hitSlop={6}
            onPress={handleShare}
            disabled={!hasLyrics}
            accessibilityLabel="Поделиться"
          >
            <Ionicons
              name="share-outline"
              size={18}
              color={hasLyrics ? '#fff' : 'rgba(255,255,255,0.35)'}
            />
          </Pressable>
          <Pressable
            style={styles.toolBtn}
            hitSlop={6}
            onPress={onExpand}
            disabled={!hasLyrics}
            accessibilityLabel="Развернуть текст"
          >
            <Ionicons
              name="expand-outline"
              size={18}
              color={hasLyrics ? '#fff' : 'rgba(255,255,255,0.35)'}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {!hasLyrics ? (
          <Text style={styles.empty}>
            Текст песни пока недоступен для этого трека.
          </Text>
        ) : (
          visibleLines.map((line, offset) => {
            const index = windowStart + offset;
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <Text
                key={`${index}-${line.slice(0, 16)}`}
                style={[
                  styles.line,
                  isPast && styles.linePast,
                  isActive && styles.lineActive,
                  !isPast && !isActive && styles.lineUpcoming,
                ]}
              >
                {line}
              </Text>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 16,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 10,
    minHeight: 72,
  },
  line: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.38)',
  },
  linePast: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.32)',
  },
  lineActive: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: '#fff',
    marginVertical: 4,
  },
  lineUpcoming: {
    color: 'rgba(255,255,255,0.42)',
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.45)',
  },
});
