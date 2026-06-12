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
import { useMusicCatalog } from '../context/MusicCatalogContext';
import TrackCover from '../components/TrackCover';
import { getClipProviderLabel, parseClipUrl } from '../utils/parseClipUrl';
import { useOsBack } from '../hooks/useOsBack';
import LocalKaraokeSync from '../components/library/LocalKaraokeSync';
import { parseLyrics } from '../utils/parseLyrics';

export default function EditLocalTrackScreen({ trackId, onBack, onOpenKaraoke }) {
  useOsBack(onBack);
  const {
    getEntryById,
    updateEntry,
    autoSyncKaraoke,
    addVideoToEntry,
    removeVideoFromEntry,
    setCoverForEntry,
    removeCoverForEntry,
    deleteEntry,
    busy,
  } = useMyLibrary();

  const { authors } = useMusicCatalog();
  const entry = getEntryById(trackId);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [description, setDescription] = useState('');
  const [clipUrl, setClipUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const lyricLines = useMemo(() => parseLyrics(description), [description]);
  const hasKaraokeMarks =
    entry?.lyricsTimings?.length > 0 &&
    entry.lyricsTimings.length === lyricLines.length &&
    entry.lyricsTimings.every((value) => typeof value === 'number');

  useEffect(() => {
    if (!entry) return;
    setTitle(entry.title || '');
    setArtist(entry.artist || '');
    setDescription(entry.description || '');
    setClipUrl(entry.clipUrl || '');
    setSaved(false);
  }, [entry?.id, entry?.updatedAt]);

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

  const clip = parseClipUrl(clipUrl);

  const handleSave = async () => {
    setError('');
    setSaved(false);
    setSaving(true);
    const result = await updateEntry(trackId, {
      title: title.trim() || 'Без названия',
      artist: artist.trim() || 'Я',
      description,
      clipUrl: clipUrl.trim(),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || 'Не удалось сохранить');
      return;
    }
    setSaved(true);
    const auto = result.autoNotes?.length
      ? `\n\nАвто: ${result.autoNotes.join(', ')}`
      : '';
    Alert.alert('Сохранено', `Изменения записаны на телефон${auto}`);
  };

  const handleSaveTimings = async (timings) => {
    const result = await updateEntry(trackId, {
      description,
      lyricsTimings: timings,
    });
    if (!result.ok) {
      throw new Error(result.error || 'Не удалось сохранить метки');
    }
    Alert.alert(
      'Метки сохранены',
      `Караоке: ${timings.length} строк с таймингами`
    );
    return result;
  };

  const handleAutoSync = async () => {
    setError('');
    setSyncing(true);
    await updateEntry(trackId, { description });
    const result = await autoSyncKaraoke(trackId);
    setSyncing(false);
    if (!result.ok) {
      setError(result.error || 'Не удалось синхронизировать');
      return;
    }
    Alert.alert(
      'Готово',
      `Караоке: ${result.lines} строк, ~${result.durationSec} сек`
    );
  };

  const handleAddVideo = async () => {
    const result = await addVideoToEntry(trackId);
    if (!result.ok && !result.cancelled) {
      Alert.alert('Ошибка', result.error || 'Не удалось добавить видео');
    }
  };

  const handleAddCover = async () => {
    const result = await setCoverForEntry(trackId);
    if (!result.ok && !result.cancelled) {
      Alert.alert('Ошибка', result.error || 'Не удалось добавить обложку');
    }
  };

  const handleRemoveCover = () => {
    Alert.alert('Удалить обложку?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => removeCoverForEntry(trackId),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить трек?',
      'Файл и все данные будут удалены с телефона.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(trackId);
            onBack?.();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Редактирование
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtn}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : saved ? (
            <View style={styles.savedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.savedBadgeText}>Сохранено</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>Сохранить</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Материалы трека</Text>

        <View style={styles.statusRow}>
          <MaterialStatus label="MP3" ok />
          <MaterialStatus label="Обложка" ok={!!entry.coverUri} />
          <MaterialStatus label="Текст" ok={lyricLines.length > 0} />
          <MaterialStatus label="Метки" ok={hasKaraokeMarks} />
          <MaterialStatus label="Клип" ok={!!clipUrl.trim()} />
          <MaterialStatus
            label="Видео"
            ok={(entry.videos || []).length > 0}
            count={(entry.videos || []).length || undefined}
          />
        </View>

        <View style={styles.coverRow}>
          <TrackCover coverUrl={entry.coverUri} size={96} borderRadius={12} />
          <View style={styles.coverActions}>
            <Pressable
              style={styles.materialBtn}
              onPress={handleAddCover}
              disabled={busy}
            >
              <Ionicons name="image-outline" size={18} color="#ffffff" />
              <Text style={styles.materialBtnText}>
                {entry.coverUri ? 'Сменить обложку' : 'Добавить обложку'}
              </Text>
            </Pressable>
            {entry.coverUri ? (
              <Pressable style={styles.materialBtnMuted} onPress={handleRemoveCover}>
                <Ionicons name="trash-outline" size={16} color="#888888" />
                <Text style={styles.materialBtnMutedText}>Удалить</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={styles.label}>Название</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Название трека"
        />

        <Text style={styles.label}>Исполнитель</Text>
        {authors.length > 0 ? (
          <View style={styles.authorChips}>
            {authors.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.authorChip,
                  artist === item.name && styles.authorChipActive,
                ]}
                onPress={() => setArtist(item.name)}
              >
                <Text
                  style={[
                    styles.authorChipText,
                    artist === item.name && styles.authorChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <TextInput
          style={styles.input}
          value={artist}
          onChangeText={setArtist}
          placeholder="Исполнитель"
        />

        <View style={styles.karaokeHeader}>
          <Text style={styles.sectionTitle}>Караоке</Text>
          {onOpenKaraoke ? (
            <Pressable
              style={styles.karaokeOpenBtn}
              onPress={() => onOpenKaraoke(trackId)}
            >
              <Ionicons name="mic-outline" size={16} color="#ffffff" />
              <Text style={styles.karaokeOpenBtnText}>Ручная синхронизация</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.label}>Текст песни</Text>
        <Text style={styles.hint}>Каждая строка караоке — с новой строки</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Текст песни..."
          multiline
          textAlignVertical="top"
        />

        <Pressable
          style={[styles.secondaryBtn, syncing && styles.btnDisabled]}
          onPress={handleAutoSync}
          disabled={syncing || busy}
        >
          {syncing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="time-outline" size={18} color="#ffffff" />
              <Text style={styles.secondaryBtnText}>Авто-синхрон караоке</Text>
            </>
          )}
        </Pressable>

        {hasKaraokeMarks ? (
          <View style={styles.markSaved}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text style={styles.markSavedText}>
              Метки караоке: {entry.lyricsTimings.length} строк
            </Text>
          </View>
        ) : lyricLines.length > 0 ? (
          <Text style={styles.meta}>
            Меток пока нет — отметьте строки ниже или нажмите авто-синхрон
          </Text>
        ) : null}

        <LocalKaraokeSync
          audioUri={entry.audioUri}
          description={description}
          lyricsTimings={entry.lyricsTimings}
          onSaveTimings={handleSaveTimings}
        />

        <Text style={styles.label}>Ссылка на клип</Text>
        <TextInput
          style={styles.input}
          value={clipUrl}
          onChangeText={setClipUrl}
          placeholder="YouTube, RuTube, Vimeo, VK..."
          autoCapitalize="none"
          autoCorrect={false}
        />
        {clip ? (
          <Text style={styles.meta}>Платформа: {getClipProviderLabel(clip)}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Видео (Reels)</Text>
        {(entry.videos || []).map((video) => (
          <View key={video.id} style={styles.videoRow}>
            <Ionicons name="videocam" size={18} color="#9a9a9a" />
            <Text style={styles.videoTitle} numberOfLines={1}>
              {video.title}
            </Text>
            <Pressable
              onPress={() => removeVideoFromEntry(trackId, video.id)}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={22} color="#888888" />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={styles.secondaryBtn}
          onPress={handleAddVideo}
          disabled={busy}
        >
          <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
          <Text style={styles.secondaryBtnText}>Добавить видео</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#c00" />
          <Text style={styles.deleteBtnText}>Удалить трек с телефона</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MaterialStatus({ label, ok, count }) {
  return (
    <View style={[styles.statusChip, ok ? styles.statusChipOk : styles.statusChipEmpty]}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={ok ? '#16a34a' : '#bbb'}
      />
      <Text style={[styles.statusChipText, ok && styles.statusChipTextOk]}>
        {label}
        {count ? ` ${count}` : ''}
      </Text>
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
    color: '#ffffff',
    fontWeight: '600',
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
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    paddingHorizontal: 8,
  },
  saveBtn: {
    minWidth: 88,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#2b2b2b',
  },
  statusChipOk: {
    backgroundColor: '#1a1a1a',
  },
  statusChipEmpty: {
    backgroundColor: '#2b2b2b',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9a9a9a',
  },
  statusChipTextOk: {
    color: '#166534',
  },
  markSaved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  markSavedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9a9a9a',
    marginBottom: 6,
    marginTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#9a9a9a',
    marginBottom: 6,
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
    minHeight: 160,
  },
  secondaryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2b2b2b',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: '#9a9a9a',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  karaokeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  karaokeOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#111',
    backgroundColor: '#000000',
  },
  karaokeOpenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  coverActions: {
    flex: 1,
    gap: 8,
  },
  materialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#2b2b2b',
  },
  materialBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  materialBtnMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  materialBtnMutedText: {
    fontSize: 13,
    color: '#9a9a9a',
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  videoTitle: {
    flex: 1,
    fontSize: 14,
    color: '#9a9a9a',
  },
  authorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  authorChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#000000',
  },
  authorChipActive: {
    borderColor: '#111',
    backgroundColor: '#2b2b2b',
  },
  authorChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9a9a9a',
  },
  authorChipTextActive: {
    color: '#fff',
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: '#c00',
  },
  deleteBtn: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#2a1515',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c00',
  },
});
