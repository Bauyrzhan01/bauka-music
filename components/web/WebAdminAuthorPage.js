import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { pickProfileImage } from '../../utils/pickProfileImage';
import {
  deleteAuthorApi,
  fetchAuthor,
  updateAuthorApi,
} from '../../api/authorsApi';
import { confirmAction } from '../../utils/confirmAction';

export default function WebAdminAuthorPage({
  authorId,
  onBack,
  onEditTrack,
  refreshToken = 0,
}) {
  const [author, setAuthor] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [pickingAvatar, setPickingAvatar] = useState(false);

  const loadAuthor = useCallback(async () => {
    setError('');
    try {
      const data = await fetchAuthor(authorId);
      if (!data) {
        setError('Автор не найден');
        return;
      }
      setAuthor(data);
      setName(data.name);
      setBio(data.bio || '');
      setAvatarUri(data.avatarUrl || null);
    } catch (err) {
      setError(err.message || 'Автор не найден');
    } finally {
      setLoading(false);
    }
  }, [authorId]);

  useEffect(() => {
    loadAuthor();
  }, [loadAuthor, refreshToken]);

  const handlePickAvatar = async () => {
    setPickingAvatar(true);
    setError('');
    const picked = await pickProfileImage();
    setPickingAvatar(false);
    if (!picked.ok) {
      if (picked.error) setError(picked.error);
      return;
    }
    setAvatarUri(picked.uri);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const sendAvatar =
        avatarUri && !avatarUri.startsWith('http') ? avatarUri : undefined;
      const result = await updateAuthorApi(authorId, {
        name,
        bio,
        avatarUri: sendAvatar,
      });
      const saved = result?.author;
      if (!saved) {
        throw new Error('Сервер не вернул данные автора');
      }
      setAuthor(saved);
      setName(saved.name);
      setBio(saved.bio || '');
      setAvatarUri(saved.avatarUrl || avatarUri);
      setMessage('Сохранено');
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: 'Удалить автора?',
      message: 'Треки останутся, но без привязки к автору',
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteAuthorApi(authorId);
      onBack();
    } catch (err) {
      setError(err.message || 'Не удалось удалить');
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!author) {
    return <Text style={styles.error}>{error || 'Автор не найден'}</Text>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← Все авторы</Text>
      </Pressable>

      <View style={styles.hero}>
        <Pressable
          style={styles.avatarLarge}
          onPress={handlePickAvatar}
          disabled={pickingAvatar}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="person" size={40} color="#111" />
          )}
        </Pressable>
        <Pressable
          style={styles.avatarPickBtn}
          onPress={handlePickAvatar}
          disabled={pickingAvatar}
        >
          {pickingAvatar ? (
            <ActivityIndicator color="#111" size="small" />
          ) : (
            <Text style={styles.avatarPickText}>
              {avatarUri ? 'Сменить фото' : 'Загрузить аватар'}
            </Text>
          )}
        </Pressable>
        <Text style={styles.heroTitle}>Страница автора</Text>
      </View>

      <Text style={styles.label}>Имя</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>О авторе</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        placeholder="Биография, описание..."
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Сохранение...' : 'Сохранить автора'}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>
        Музыка автора · {author.tracks?.length ?? 0}
      </Text>

      {author.tracks?.length === 0 ? (
        <Text style={styles.hint}>
          Нет треков. В разделе «Музыка» привяжите трек к этому автору
        </Text>
      ) : (
        <View style={styles.trackList}>
          {author.tracks.map((track) => (
            <Pressable
              key={track.id}
              style={styles.trackRow}
              onPress={() => onEditTrack?.(track)}
            >
              <Ionicons name="musical-note" size={18} color="#111" />
              <View style={styles.trackText}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                {track.description ? (
                  <Text style={styles.trackDesc} numberOfLines={2}>
                    {track.description}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.editLink}>Изменить</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Удалить автора</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPickBtn: {
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  avatarPickText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
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
    minHeight: 100,
  },
  success: {
    color: '#0a7a2f',
    marginTop: 10,
  },
  error: {
    color: '#c00',
    marginTop: 10,
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 32,
    marginBottom: 12,
  },
  hint: {
    color: '#888',
    fontSize: 14,
  },
  trackList: {
    gap: 8,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  trackText: {
    flex: 1,
  },
  trackTitle: {
    fontWeight: '600',
  },
  trackDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  editLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
  deleteBtn: {
    marginTop: 32,
    marginBottom: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: {
    color: '#c00',
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
});
