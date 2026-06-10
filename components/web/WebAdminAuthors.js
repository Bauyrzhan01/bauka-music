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
import { createAuthor, fetchAuthors } from '../../api/authorsApi';
import AdminPageHeader from './AdminPageHeader';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

export default function WebAdminAuthors({ onOpenAuthor }) {
  const { isMobile } = useWebBreakpoint();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAuthors = useCallback(async () => {
    setError('');
    try {
      const list = await fetchAuthors();
      setAuthors(list);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить авторов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  const handleCreate = async () => {
    setError('');
    setSaving(true);
    try {
      await createAuthor({ name, bio });
      setName('');
      setBio('');
      setShowForm(false);
      await loadAuthors();
    } catch (err) {
      setError(err.message || 'Не удалось создать автора');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <AdminPageHeader
        title="Авторы"
        subtitle="Страница автора и его треки в приложении"
      >
        <Pressable
          style={[styles.addBtn, isMobile && styles.addBtnFull]}
          onPress={() => setShowForm((v) => !v)}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
          <Text style={styles.addBtnText}>
            {showForm ? 'Отмена' : 'Новый автор'}
          </Text>
        </Pressable>
      </AdminPageHeader>

      {showForm ? (
        <View style={styles.formBox}>
          <Text style={styles.label}>Имя автора</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Например: Adele"
          />
          <Text style={styles.label}>О авторе</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Краткая биография..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Создание...' : 'Создать автора'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : authors.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="person-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Пока нет авторов. Создайте первого</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {authors.map((author) => (
            <Pressable
              key={author.id}
              style={styles.row}
              onPress={() => onOpenAuthor(author.id)}
            >
              <View style={styles.avatar}>
                {author.avatarUrl ? (
                  <Image
                    source={{ uri: author.avatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="person" size={22} color="#111" />
                )}
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name}>{author.name || 'Автор'}</Text>
                <Text style={styles.meta}>
                  Треков: {author.trackCount ?? 0}
                </Text>
                {author.bio ? (
                  <Text style={styles.bioPreview} numberOfLines={2}>
                    {author.bio}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 48,
  },
  addBtnFull: {
    width: '100%',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  formBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 90,
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#111',
    paddingVertical: 12,
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
  error: {
    color: '#c00',
    marginBottom: 12,
  },
  loader: {
    marginTop: 24,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    color: '#888',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 56,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  bioPreview: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
});
