import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useActiveLyricLine } from '../../hooks/useActiveLyricLine';
import KaraokeLyricLine from './KaraokeLyricLine';
import { KARAOKE_PALETTES } from '../../utils/karaokePalettes';

const LINE_HEIGHT = 44;

function pickVisibleIndices(activeIndex, total, maxLines) {
  if (total <= 0) return [];
  if (!maxLines || maxLines >= total) {
    return Array.from({ length: total }, (_, i) => i);
  }
  if (maxLines === 1) return [Math.min(activeIndex, total - 1)];
  if (total === 1) return [0];
  if (activeIndex >= total - 1) {
    return [total - 2, total - 1];
  }
  return [activeIndex, activeIndex + 1];
}

export default function KaraokeLyrics({
  lyricsText,
  positionMillis,
  durationMillis,
  lyricsTimings,
  bounded = false,
  tone = 'onLight',
  maxLines = null,
}) {
  const karaoke = KARAOKE_PALETTES[tone] || KARAOKE_PALETTES.onLight;
  const palette =
    tone === 'onDark'
      ? {
          emptyBg: 'rgba(255,255,255,0.1)',
          emptyBorder: karaoke.border,
          title: 'rgba(255,255,255,0.85)',
          text: 'rgba(255,255,255,0.6)',
        }
      : {
          emptyBg: '#fafafa',
          emptyBorder: karaoke.border,
          title: '#666',
          text: '#999',
        };
  const scrollRef = useRef(null);
  const { lines, activeIndex } = useActiveLyricLine(
    lyricsText,
    positionMillis,
    durationMillis,
    lyricsTimings
  );

  const visibleIndices = pickVisibleIndices(activeIndex, lines.length, maxLines);
  const compactMode = maxLines != null && maxLines <= 2;

  useEffect(() => {
    if (compactMode || !lines.length || !scrollRef.current) return;

    const offset = Math.max(0, activeIndex * LINE_HEIGHT - LINE_HEIGHT * 2);
    scrollRef.current.scrollTo({ y: offset, animated: true });
  }, [activeIndex, lines.length, compactMode]);

  if (!lines.length) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.emptyBox,
          bounded && styles.emptyBoxBounded,
          {
            backgroundColor: palette.emptyBg,
            borderColor: palette.emptyBorder,
          },
        ]}
      >
        <Text style={[styles.emptyTitle, { color: palette.title }]}>Караоке</Text>
        <Text style={[styles.emptyText, { color: palette.text }]}>
          Добавьте текст песни в админке → Музыка → Изменить
        </Text>
      </Animated.View>
    );
  }

  const lineItems = visibleIndices.map((index) => (
    <KaraokeLyricLine
      key={`${index}-${lines[index].slice(0, 12)}`}
      text={lines[index]}
      isActive={index === activeIndex}
      isPast={index < activeIndex}
      bounded={bounded || compactMode}
      tone={tone}
    />
  ));

  const content = compactMode ? (
    <View
      style={[
        styles.compactList,
        bounded && styles.listBounded,
        maxLines === 2 && styles.compactListTwo,
      ]}
    >
      {lineItems}
    </View>
  ) : (
    <ScrollView
      ref={scrollRef}
      style={[styles.list, bounded && styles.listBounded]}
      contentContainerStyle={[
        styles.listContent,
        bounded && styles.listContentBounded,
      ]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {lineItems}
    </ScrollView>
  );

  return (
    <View
      style={[
        styles.wrap,
        bounded && styles.wrapBounded,
        compactMode && styles.wrapCompact,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 120,
    marginTop: 4,
  },
  wrapBounded: {
    width: '100%',
    height: '100%',
    marginTop: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  listBounded: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  listContentBounded: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexGrow: 1,
  },
  wrapCompact: {
    minHeight: 0,
    flex: 0,
  },
  compactList: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  compactListTwo: {
    minHeight: 88,
    maxHeight: 96,
    justifyContent: 'center',
    gap: 2,
  },
  emptyBoxBounded: {
    flex: 1,
    minHeight: 0,
    marginTop: 0,
    height: '100%',
  },
  emptyBox: {
    flex: 1,
    minHeight: 120,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9a9a9a',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#9a9a9a',
    textAlign: 'center',
    lineHeight: 18,
  },
});
