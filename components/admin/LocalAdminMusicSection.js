import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyLibrary } from '../../context/MyLibraryContext';
import DeviceMusicPickerScreen from '../../screens/DeviceMusicPickerScreen';

export default function LocalAdminMusicSection({
  entries,
  onEditTrack,
  onOpenKaraoke,
}) {
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const {
    ready,
    busy,
    pickAndAddTrack,
    deleteEntry,
    importDeviceMusicAssets,
    exportBackup,
    importBackup,
  } = useMyLibrary();

  const handleAdd = async () => {
    const result = await pickAndAddTrack();
    if (result.cancelled) return;
    if (!result.ok) {
      Alert.alert('Ошибка', result.error || 'Не удалось добавить трек');
      return;
    }
    if (result.entry) {
      onEditTrack?.(result.entry.id);
    }
  };

  const handleDelete = (entry) => {
    Alert.alert(
      'Удалить трек?',
      `«${entry.title}» будет удалён с телефона.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteEntry(entry.id),
        },
      ]
    );
  };

  const handleImport = () => {
    Alert.alert(
      'Импорт резервной копии',
      'Добавить треки к существующим или заменить всю библиотеку?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Добавить',
          onPress: async () => {
            const result = await importBackup({ replace: false });
            if (result.cancelled) return;
            if (!result.ok) {
              Alert.alert('Импорт', result.error || 'Ошибка');
              return;
            }
            Alert.alert('Готово', `Импортировано треков: ${result.count}`);
          },
        },
        {
          text: 'Заменить всё',
          style: 'destructive',
          onPress: async () => {
            const result = await importBackup({ replace: true });
            if (result.cancelled) return;
            if (!result.ok) {
              Alert.alert('Импорт', result.error || 'Ошибка');
              return;
            }
            Alert.alert('Готово', `Импортировано треков: ${result.count}`);
          },
        },
      ]
    );
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (showDevicePicker) {
    return (
      <DeviceMusicPickerScreen
        onBack={() => setShowDevicePicker(false)}
        onImport={importDeviceMusicAssets}
        busy={busy}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Добавляйте MP3, редактируйте треки и управляйте библиотекой прямо здесь.
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryBtn, busy && styles.btnDisabled]}
          onPress={handleAdd}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Добавить MP3</Text>
            </>
          )}
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, busy && styles.btnDisabled]}
          onPress={() => setShowDevicePicker(true)}
          disabled={busy}
        >
          <Ionicons name="phone-portrait-outline" size={18} color="#ffffff" />
          <Text style={styles.secondaryBtnText}>С телефона</Text>
        </Pressable>
      </View>

      <View style={styles.backupRow}>
        <Pressable
          style={styles.backupBtn}
          onPress={async () => {
            const result = await exportBackup();
            if (!result.ok) {
              Alert.alert('Экспорт', result.error || 'Не удалось экспортировать');
            }
          }}
          disabled={busy || !entries.length}
        >
          <Ionicons name="share-outline" size={16} color="#ffffff" />
          <Text style={styles.backupBtnText}>Экспорт</Text>
        </Pressable>
        <Pressable style={styles.backupBtn} onPress={handleImport} disabled={busy}>
          <Ionicons name="download-outline" size={16} color="#ffffff" />
          <Text style={styles.backupBtnText}>Импорт</Text>
        </Pressable>
      </View>

      {!entries.length ? (
        <Text style={styles.empty}>Пока нет треков — добавьте первый MP3.</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.title} numberOfLines={1}>
                {entry.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {entry.artist}
                {entry.description?.trim() ? ' · есть текст' : ''}
                {entry.coverUri ? ' · обложка' : ''}
              </Text>
            </View>
            <Pressable
              style={styles.iconBtn}
              onPress={() => onOpenKaraoke?.(entry.id)}
              accessibilityLabel="Караоке"
            >
              <Ionicons name="mic-outline" size={20} color="#9a9a9a" />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => onEditTrack?.(entry.id)}
              accessibilityLabel="Редактировать"
            >
              <Ionicons name="create-outline" size={20} color="#9a9a9a" />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => handleDelete(entry)}
              accessibilityLabel="Удалить"
            >
              <Ionicons name="trash-outline" size={20} color="#c00" />
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  loading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#9a9a9a',
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2b2b2b',
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  backupRow: {
    flexDirection: 'row',
    gap: 8,
  },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  backupBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  empty: {
    fontSize: 14,
    color: '#9a9a9a',
    lineHeight: 20,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: '#9a9a9a',
  },
  iconBtn: {
    padding: 8,
  },
});
