import { Alert, ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyLibrary } from '../../context/MyLibraryContext';

export default function ProfileAddMusicActions({ onEditTrack, onOpenMyMusic }) {
  const { busy, pickAndAddTrack } = useMyLibrary();

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

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.primaryBtn, busy && styles.btnDisabled]}
        onPress={handleAdd}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Добавить MP3</Text>
          </>
        )}
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={onOpenMyMusic}>
        <Ionicons name="musical-notes-outline" size={18} color="#111" />
        <Text style={styles.secondaryBtnText}>Моя музыка</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fafafa',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
