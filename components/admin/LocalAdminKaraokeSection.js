import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseLyrics } from '../../utils/parseLyrics';

export default function LocalAdminKaraokeSection({ entries, onOpenKaraoke }) {
  if (!entries.length) {
    return (
      <Text style={styles.empty}>
        Сначала добавьте музыку в разделе «Музыка», затем откройте караоке для
        трека.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Выберите трек → включите аудио → нажимайте «Отметить» на каждой строке
        текста.
      </Text>
      {entries.map((entry) => {
        const lines = parseLyrics(entry.description || '');
        const marked =
          entry.lyricsTimings?.length > 0 &&
          entry.lyricsTimings.length === lines.length &&
          entry.lyricsTimings.every((value) => typeof value === 'number');

        return (
          <Pressable
            key={entry.id}
            style={styles.row}
            onPress={() => onOpenKaraoke?.(entry.id)}
          >
            <View style={styles.icon}>
              <Ionicons name="mic" size={18} color="#111" />
            </View>
            <View style={styles.text}>
              <Text style={styles.title} numberOfLines={1}>
                {entry.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {entry.artist}
                {lines.length > 0
                  ? ` · ${lines.length} строк`
                  : ' · нет текста'}
                {marked ? ' · метки ✓' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#bbb" />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginBottom: 4,
  },
  empty: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: '#888',
  },
});
