import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyLibrary } from '../context/MyLibraryContext';
import { usePlayer } from '../context/PlayerContext';
import TrackResultItem from '../components/search/TrackResultItem';
import { localLibraryEntryToTrack } from '../utils/localLibraryToTrack';
import { useOsBack } from '../hooks/useOsBack';
import DeviceMusicPickerScreen from './DeviceMusicPickerScreen';

export default function MyMusicScreen({ onBack, onEditTrack, onOpenKaraoke }) {
  useOsBack(onBack);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const {
    entries,
    ready,
    busy,
    pickAndAddTrack,
    deleteEntry,
    exportBackup,
    importBackup,
    importDeviceMusicAssets,
  } = useMyLibrary();
  const { playTrack, openPlayer, currentTrack } = usePlayer();

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

  const handlePlay = useCallback(
    (entry) => {
      const track = localLibraryEntryToTrack(entry);
      if (!track) return;
      playTrack(track, entries.map(localLibraryEntryToTrack).filter(Boolean));
      openPlayer();
    },
    [entries, playTrack, openPlayer]
  );

  const handleExport = async () => {
    const result = await exportBackup();
    if (!result.ok) {
      Alert.alert('Экспорт', result.error || 'Не удалось экспортировать');
    }
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

  const listHeader = (
    <View style={styles.hero}>
      <View style={styles.heroIcon}>
        <Ionicons name="musical-notes" size={28} color="#111" />
      </View>
      <Text style={styles.heroTitle}>Моя музыка</Text>
      <Text style={styles.heroSubtitle}>
        {entries.length}{' '}
        {entries.length === 1 ? 'трек на телефоне' : 'треков на телефоне'}
      </Text>
      <Pressable
        style={[styles.addBtn, busy && styles.addBtnDisabled]}
        onPress={handleAdd}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Добавить MP3</Text>
          </>
        )}
      </Pressable>
      <Pressable
        style={[styles.deviceBtn, busy && styles.addBtnDisabled]}
        onPress={() => setShowDevicePicker(true)}
        disabled={busy}
      >
        <Ionicons name="phone-portrait-outline" size={18} color="#111" />
        <Text style={styles.deviceBtnText}>Из музыки телефона</Text>
      </Pressable>
      {entries.length > 0 ? (
        <View style={styles.backupRow}>
          <Pressable
            style={styles.backupBtn}
            onPress={handleExport}
            disabled={busy}
          >
            <Ionicons name="share-outline" size={18} color="#111" />
            <Text style={styles.backupBtnText}>Экспорт ZIP</Text>
          </Pressable>
          <Pressable
            style={styles.backupBtn}
            onPress={handleImport}
            disabled={busy}
          >
            <Ionicons name="download-outline" size={18} color="#111" />
            <Text style={styles.backupBtnText}>Импорт</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.backupBtn, styles.backupBtnSolo]}
          onPress={handleImport}
          disabled={busy}
        >
          <Ionicons name="download-outline" size={18} color="#111" />
          <Text style={styles.backupBtnText}>Импорт резервной копии</Text>
        </Pressable>
      )}
    </View>
  );

  const emptyComponent = (
    <View style={styles.empty}>
      {listHeader}
      <Ionicons name="folder-open-outline" size={48} color="#ccc" />
      <Text style={styles.emptyTitle}>Пока пусто</Text>
      <Text style={styles.emptyText}>
        Нажмите «Добавить MP3» выше — затем добавьте обложку, текст, клип и видео
      </Text>
    </View>
  );

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#111" />
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
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.topTitle}>Моя музыка</Text>
        <View style={styles.topSpacer} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={entries.length ? listHeader : null}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={
          entries.length ? styles.listContent : styles.listEmpty
        }
        renderItem={({ item }) => {
          const track = localLibraryEntryToTrack(item);
          const active = currentTrack?.id === item.id;
          return (
            <View style={styles.rowWrap}>
              <View style={styles.rowMain}>
                <TrackResultItem
                  track={track}
                  active={active}
                  onPress={() => handlePlay(item)}
                />
              </View>
              {onOpenKaraoke ? (
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => onOpenKaraoke(item.id)}
                  accessibilityLabel="Караоке"
                >
                  <Ionicons name="mic-outline" size={22} color="#555" />
                </Pressable>
              ) : null}
              <Pressable
                style={styles.iconBtn}
                onPress={() => onEditTrack?.(item.id)}
                accessibilityLabel="Редактировать"
              >
                <Ionicons name="create-outline" size={22} color="#555" />
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={() => handleDelete(item)}
                accessibilityLabel="Удалить"
              >
                <Ionicons name="trash-outline" size={22} color="#c00" />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 8,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  topSpacer: {
    width: 40,
  },
  listContent: {
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#888',
  },
  addBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addBtnDisabled: {
    opacity: 0.7,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  deviceBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#111',
    alignSelf: 'stretch',
  },
  deviceBtnText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },
  backupRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  backupBtnSolo: {
    marginTop: 10,
    alignSelf: 'stretch',
  },
  backupBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  rowMain: {
    flex: 1,
  },
  iconBtn: {
    padding: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
