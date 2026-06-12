import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyLibrary } from '../context/MyLibraryContext';
import LocalKaraokeSync from '../components/library/LocalKaraokeSync';
import { parseLyrics } from '../utils/parseLyrics';
import { useOsBack } from '../hooks/useOsBack';

export default function LocalKaraokeScreen({ trackId, onBack, onOpenEdit }) {
  useOsBack(onBack);
  const { getEntryById, updateEntry, autoSyncKaraoke, busy } = useMyLibrary();
  const entry = getEntryById(trackId);
  const [description, setDescription] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [savingText, setSavingText] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setDescription(entry.description || '');
  }, [entry?.id, entry?.updatedAt]);

  const lyricLines = useMemo(() => parseLyrics(description), [description]);
  const hasMarks =
    entry?.lyricsTimings?.length > 0 &&
    entry.lyricsTimings.length === lyricLines.length;

  if (!entry) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Трек не найден</Text>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>← Назад</Text>
        </Pressable>
      </View>
    );
  }

  const handleSaveText = async () => {
    setSavingText(true);
    const result = await updateEntry(trackId, { description });
    setSavingText(false);
    if (!result.ok) {
      Alert.alert('Текст', result.error || 'Не удалось сохранить');
      return;
    }
    Alert.alert('Сохранено', 'Текст песни обновлён');
  };

  const handleAutoSync = async () => {
    setSyncing(true);
    await updateEntry(trackId, { description });
    const result = await autoSyncKaraoke(trackId);
    setSyncing(false);
    if (!result.ok) {
      Alert.alert('Авто-синхрон', result.error || 'Не удалось');
      return;
    }
    Alert.alert(
      'Готово',
      `Авто: ${result.lines} строк. Можно подправить вручную ниже.`
    );
  };

  const handleSaveTimings = async (timings) => {
    const result = await updateEntry(trackId, {
      description,
      lyricsTimings: timings,
    });
    if (!result.ok) {
      throw new Error(result.error || 'Не удалось сохранить метки');
    }
    Alert.alert('Метки сохранены', `Караоке: ${timings.length} строк`);
    return result;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>
        <View style={styles.topText}>
          <Text style={styles.topTitle} numberOfLines={1}>
            Ручная синхронизация
          </Text>
          <Text style={styles.topSubtitle} numberOfLines={1}>
            {entry.title} · {entry.artist}
          </Text>
        </View>
        {onOpenEdit ? (
          <Pressable onPress={() => onOpenEdit(trackId)} style={styles.editBtn}>
            <Ionicons name="create-outline" size={22} color="#ffffff" />
          </Pressable>
        ) : (
          <View style={styles.topSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Текст песни</Text>
        <Text style={styles.hint}>Каждая строка караоке — с новой строки</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Введите текст..."
          multiline
          textAlignVertical="top"
        />
        <Pressable
          style={[styles.saveTextBtn, savingText && styles.btnDisabled]}
          onPress={handleSaveText}
          disabled={savingText || busy}
        >
          {savingText ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveTextBtnLabel}>Сохранить текст</Text>
          )}
        </Pressable>

        <View style={styles.syncActions}>
          <Pressable
            style={[styles.autoBtn, syncing && styles.btnDisabled]}
            onPress={handleAutoSync}
            disabled={syncing || busy || !lyricLines.length}
          >
            {syncing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={18} color="#ffffff" />
                <Text style={styles.autoBtnText}>Авто-синхрон</Text>
              </>
            )}
          </Pressable>
        </View>

        {hasMarks ? (
          <View style={styles.markBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text style={styles.markBadgeText}>
              Сохранено меток: {entry.lyricsTimings.length}
            </Text>
          </View>
        ) : null}

        <LocalKaraokeSync
          audioUri={entry.audioUri}
          description={description}
          lyricsTimings={entry.lyricsTimings}
          onSaveTimings={handleSaveTimings}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  missingText: {
    fontSize: 16,
    color: '#9a9a9a',
  },
  backLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  backBtn: {
    padding: 8,
  },
  topText: {
    flex: 1,
    paddingHorizontal: 4,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  topSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#9a9a9a',
  },
  editBtn: {
    padding: 8,
  },
  topSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  hint: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
    color: '#9a9a9a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
  },
  textArea: {
    minHeight: 140,
  },
  saveTextBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  saveTextBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  syncActions: {
    marginTop: 16,
    marginBottom: 8,
  },
  autoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2b2b2b',
  },
  autoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  markBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  markBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
});
