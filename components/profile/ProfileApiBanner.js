import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { getApiBaseUrl } from '../../constants/api';

export default function ProfileApiBanner({ onOpenSettings }) {
  const { syncError, refreshCatalog, refreshing } = useMusicCatalog();

  if (!syncError) return null;

  return (
    <Pressable style={styles.wrap} onPress={onOpenSettings}>
      <Ionicons name="cloud-offline-outline" size={20} color="#b45309" />
      <View style={styles.text}>
        <Text style={styles.title}>Сервер недоступен</Text>
        <Text style={styles.hint} numberOfLines={2}>
          {syncError}
        </Text>
        <Text style={styles.url}>{getApiBaseUrl()}</Text>
      </View>
      <TouchableOpacity
        onPress={refreshCatalog}
        disabled={refreshing}
        hitSlop={8}
        activeOpacity={0.7}
      >
        <Text style={styles.retry}>{refreshing ? '…' : 'Обновить'}</Text>
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#2a2015',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  text: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9a3412',
  },
  hint: {
    fontSize: 12,
    color: '#c2410c',
    lineHeight: 16,
  },
  url: {
    fontSize: 11,
    color: '#9a9a9a',
  },
  retry: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
});
