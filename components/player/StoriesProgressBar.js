import { View, StyleSheet } from 'react-native';

export default function StoriesProgressBar({
  count,
  activeIndex,
  progress,
  topInset = 0,
}) {
  if (!count) return null;

  return (
    <View style={[styles.row, { top: topInset + 6 }]}>
      {Array.from({ length: count }).map((_, index) => {
        let fillPercent = 0;
        if (index < activeIndex) {
          fillPercent = 100;
        } else if (index === activeIndex) {
          fillPercent = Math.min(Math.max(progress, 0), 1) * 100;
        }

        return (
          <View key={`seg-${index}`} style={styles.segment}>
            <View style={[styles.fill, { width: `${fillPercent}%` }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 20,
    flexDirection: 'row',
    gap: 4,
    height: 3,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});
