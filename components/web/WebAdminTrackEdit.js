import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { updateMusicTrack } from '../../api/musicApi';
import { fetchAuthors } from '../../api/authorsApi';
import { getClipProviderLabel, parseClipUrl } from '../../utils/parseClipUrl';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';
import WebAdminKaraokeSync from './WebAdminKaraokeSync';

export default function WebAdminTrackEdit({
  track,
  authors: authorsProp = [],
  onBack,
  onSaved,
  onPartialSaved,
  onOpenAuthor,
}) {
  const [authors, setAuthors] = useState(authorsProp);
  const [title, setTitle] = useState(track.title);
  const [description, setDescription] = useState(track.description || '');
  const [authorId, setAuthorId] = useState(track.authorId || '');
  const [clipUrl, setClipUrl] = useState(
    track.clipUrl || track.youtubeUrl || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { isMobile, pageTitleSize } = useWebBreakpoint();

  useEffect(() => {
    if (authorsProp.length) {
      setAuthors(authorsProp);
      return;
    }
    fetchAuthors()
      .then(setAuthors)
      .catch(() => {});
  }, [authorsProp]);

  useEffect(() => {
    setTitle(track.title);
    setDescription(track.description || '');
    setAuthorId(track.authorId || '');
    setClipUrl(track.clipUrl || track.youtubeUrl || '');
  }, [
    track.filename,
    track.title,
    track.description,
    track.authorId,
    track.clipUrl,
    track.youtubeUrl,
  ]);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const result = await updateMusicTrack(track.filename, {
        title,
        description,
        authorId: authorId || null,
        clipUrl: clipUrl.trim(),
      });
      onSaved(result);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← Назад к списку</Text>
      </Pressable>

      <Text style={[styles.pageTitle, { fontSize: pageTitleSize }]}>
        Редактировать трек
      </Text>
      <Text style={styles.fileLabel}>{track.filename}</Text>

      <Text style={styles.label}>Название</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Название песни"
      />

      <Text style={styles.label}>Автор</Text>
      <View style={styles.authorRow}>
        <Pressable
          style={[styles.chip, !authorId && styles.chipActive]}
          onPress={() => setAuthorId('')}
        >
          <Text style={[styles.chipText, !authorId && styles.chipTextActive]}>
            Без автора
          </Text>
        </Pressable>
        {authors.map((author) => {
          const active = authorId === author.id;
          return (
            <Pressable
              key={author.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setAuthorId(author.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {author.name || 'Автор'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {authorId && onOpenAuthor ? (
        <Pressable onPress={() => onOpenAuthor(authorId)}>
          <Text style={styles.link}>Открыть страницу автора →</Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>Клип (YouTube / RuTube / Vimeo / VK)</Text>
      <TextInput
        style={styles.input}
        value={clipUrl}
        onChangeText={setClipUrl}
        placeholder="Ссылка на видео любого сервиса"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {clipUrl.trim() ? (
        <Text
          style={
            parseClipUrl(clipUrl) ? styles.hintOk : styles.hintWarn
          }
        >
          {parseClipUrl(clipUrl)
            ? `Распознано: ${getClipProviderLabel(parseClipUrl(clipUrl).provider)} — кнопка «Клип» в плеере`
            : 'Ссылка не распознана. YouTube, RuTube, Vimeo или VK Video'}
        </Text>
      ) : (
        <Text style={styles.hintMuted}>
          Необязательно. Пустое поле — без клипа в плеере.
        </Text>
      )}

      <Text style={styles.label}>Текст / описание</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Текст караоке — каждая строка с новой строки..."
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <WebAdminKaraokeSync
        track={track}
        description={description}
        onTimingsSaved={(result) => {
          const handler = onPartialSaved || onSaved;
          const updated =
            result.track ||
            result.tracks?.find((t) => t.filename === track.filename);
          if (updated) {
            handler({ ...result, track: updated });
          }
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[
          styles.saveBtn,
          isMobile && styles.saveBtnSticky,
          saving && styles.saveBtnDisabled,
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  fileLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  hintOk: {
    fontSize: 12,
    color: '#0a7a2f',
    marginTop: 6,
  },
  hintWarn: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 6,
  },
  hintMuted: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
  },
  authorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#111',
  },
  chipText: {
    fontSize: 13,
    color: '#111',
  },
  chipTextActive: {
    color: '#fff',
  },
  link: {
    fontSize: 13,
    color: '#111',
    fontWeight: '600',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  error: {
    color: '#c00',
    marginTop: 12,
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 52,
  },
  saveBtnSticky: {
    marginBottom: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
