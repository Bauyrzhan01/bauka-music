import { Alert, ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyLibrary } from '../../context/MyLibraryContext';

const MATERIALS = [
  { icon: 'musical-notes', label: 'MP3', color: '#ffffff' },
  { icon: 'image', label: 'Обложка', color: '#7c3aed' },
  { icon: 'document-text', label: 'Текст', color: '#2563eb' },
  { icon: 'link', label: 'Клип', color: '#dc2626' },
  { icon: 'videocam', label: 'Видео', color: '#059669' },
];

export default function HomeAddMusicSection({ onEditTrack, onOpenMyMusic }) {
  const { entries, busy, pickAndAddTrack, importBackup } = useMyLibrary();
  const hasTracks = entries.length > 0;

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

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        <Text style={styles.title}>
          {hasTracks ? 'Добавить ещё' : 'Добавьте свою музыку'}
        </Text>
        <Text style={styles.subtitle}>
          MP3 с телефона, затем обложка, текст, клип и видео
        </Text>

        <View style={styles.materials}>
          {MATERIALS.map((item) => (
            <View key={item.label} style={styles.materialChip}>
              <View style={[styles.materialIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={14} color="#fff" />
              </View>
              <Text style={styles.materialLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.primaryBtn, busy && styles.btnDisabled]}
          onPress={handleAdd}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.primaryBtnText}>Добавить MP3</Text>
            </>
          )}
        </Pressable>

        <View style={styles.secondaryRow}>
          <Pressable
            style={[styles.secondaryBtn, busy && styles.btnDisabled]}
            onPress={handleImport}
            disabled={busy}
          >
            <Ionicons name="download-outline" size={18} color="#ffffff" />
            <Text style={styles.secondaryBtnText}>Импорт ZIP</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onOpenMyMusic}>
            <Ionicons name="folder-open-outline" size={18} color="#ffffff" />
            <Text style={styles.secondaryBtnText}>Моя музыка</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#9a9a9a',
    lineHeight: 18,
  },
  materials: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  materialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  materialIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9a9a9a',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2b2b2b',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
