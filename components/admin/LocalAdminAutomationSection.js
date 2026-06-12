import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyLibrary } from '../../context/MyLibraryContext';

export default function LocalAdminAutomationSection() {
  const { entries, busy, runBatchAutomation } = useMyLibrary();
  const [running, setRunning] = useState(false);

  const missingCovers = entries.filter((entry) => !entry.coverUri).length;
  const missingKaraoke = entries.filter(
    (entry) =>
      entry.description?.trim() &&
      (!entry.lyricsTimings?.length ||
        entry.lyricsTimings.length !==
          entry.description.split('\n').filter((line) => line.trim()).length)
  ).length;

  const handleRun = async () => {
    setRunning(true);
    const result = await runBatchAutomation();
    setRunning(false);

    if (!result.ok) {
      Alert.alert('Автоматизация', result.error || 'Не удалось выполнить');
      return;
    }

    const { authors, covers, karaoke } = result.stats;
    Alert.alert(
      'Готово',
      [
        `Авторы/аватары: ${authors}`,
        `Обложки: ${covers}`,
        `Караоке: ${karaoke}`,
      ].join('\n')
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Приложение само создаёт авторов, цветные обложки и аватары, синхронизирует
        караоке по тексту. Здесь можно прогнать всё для уже загруженных треков.
      </Text>

      <View style={styles.statsRow}>
        <StatPill icon="image-outline" label="Без обложки" value={missingCovers} />
        <StatPill icon="mic-outline" label="Без караоке" value={missingKaraoke} />
      </View>

      <Pressable
        style={[styles.runBtn, (busy || running) && styles.runBtnDisabled]}
        onPress={handleRun}
        disabled={busy || running || !entries.length}
      >
        {running ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="flash-outline" size={20} color="#fff" />
            <Text style={styles.runBtnText}>Автоматизировать всё</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={16} color="#9a9a9a" />
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  hint: {
    fontSize: 13,
    color: '#9a9a9a',
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#2b2b2b',
    gap: 2,
  },
  pillValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  pillLabel: {
    fontSize: 11,
    color: '#9a9a9a',
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2b2b2b',
    borderRadius: 14,
    paddingVertical: 14,
  },
  runBtnDisabled: {
    opacity: 0.55,
  },
  runBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
