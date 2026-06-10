import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { resolveAuthorAvatarUrl } from '../../utils/resolveServerMediaUrl';

export default function LocalAdminAuthorsSection({ onOpenAuthor }) {
  const { authors, createLocalAuthor } = useMusicCatalog();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    const result = await createLocalAuthor({ name, bio });
    setSaving(false);

    if (!result.ok) {
      Alert.alert('Автор', result.error || 'Не удалось создать');
      return;
    }

    setName('');
    setBio('');
    setShowForm(false);
    Alert.alert('Готово', `Автор «${result.author.name}» создан`);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Авторы создаются автоматически при импорте и сохранении трека. Здесь
        можно добавить автора вручную — аватар сгенерируется сам.
      </Text>

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.label}>Имя автора</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Например: Bauka"
            maxLength={60}
          />
          <Text style={styles.label}>О себе</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={bio}
            onChangeText={setBio}
            placeholder="Короткое описание (необязательно)"
            multiline
            maxLength={200}
          />
          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => {
                setShowForm(false);
                setName('');
                setBio('');
              }}
            >
              <Text style={styles.cancelBtnText}>Отмена</Text>
            </Pressable>
            <Pressable
              style={[styles.createBtn, saving && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createBtnText}>Создать</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#111" />
          <Text style={styles.addBtnText}>Новый автор</Text>
        </Pressable>
      )}

      {authors.length === 0 ? (
        <Text style={styles.empty}>Пока нет авторов</Text>
      ) : (
        authors.map((author) => {
          const avatarUri = resolveAuthorAvatarUrl(author);
          const initial = (author.name || '?').charAt(0).toUpperCase();

          return (
          <Pressable
            key={author.id}
            style={styles.authorRow}
            onPress={() =>
              onOpenAuthor?.({
                authorId: author.id,
                authorName: author.name,
              })
            }
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.authorAvatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={`${author.id}-${avatarUri}`}
              />
            ) : (
              <View style={styles.authorIcon}>
                <Text style={styles.authorInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.authorText}>
              <Text style={styles.authorName}>{author.name}</Text>
              {author.bio ? (
                <Text style={styles.authorBio} numberOfLines={2}>
                  {author.bio}
                </Text>
              ) : null}
              <Text style={styles.authorMeta}>
                {author.trackCount}{' '}
                {author.trackCount === 1 ? 'трек' : 'треков'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#bbb" />
          </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111',
    backgroundColor: '#fff',
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  form: {
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8f8f8',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: '#444',
  },
  createBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  createBtnText: {
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  empty: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  authorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#111',
  },
  authorInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  authorText: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  authorBio: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 17,
  },
  authorMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
