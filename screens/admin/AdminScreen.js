import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Switch,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useBanners } from '../../context/BannersContext';
import { confirmAction } from '../../utils/confirmAction';
import AdminBannerFormScreen from './AdminBannerFormScreen';

export default function AdminScreen({ onBack }) {
  const { banners, launchBanner, stopBanner, deleteBanner } = useBanners();
  const [editingBanner, setEditingBanner] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating || editingBanner) {
    return (
      <AdminBannerFormScreen
        banner={editingBanner}
        onBack={() => {
          setIsCreating(false);
          setEditingBanner(null);
        }}
      />
    );
  }

  const handleDelete = async (banner) => {
    const ok = await confirmAction({
      title: 'Удалить баннер?',
      message: 'Фото будет удалено из списка',
      confirmText: 'Удалить',
      destructive: true,
    });

    if (ok) {
      await deleteBanner(banner.id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.title}>Админка — NBO</Text>
        <Pressable onPress={() => setIsCreating(true)}>
          <Ionicons name="add-circle-outline" size={26} color="#000" />
        </Pressable>
      </View>

      <Text style={styles.hint}>
        Добавьте фото и включите «Запустить» — баннер появится на главной
      </Text>

      <FlatList
        data={banners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Нет баннеров. Нажмите + и загрузите фото</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Text style={styles.thumbPlaceholderText}>Нет фото — удалите или измените</Text>
              </View>
            )}

            <View style={styles.cardActions}>
              <View style={styles.launchRow}>
                <Text>Запущен на главной</Text>
                <Switch
                  value={item.active}
                  onValueChange={(value) =>
                    value ? launchBanner(item.id) : stopBanner(item.id)
                  }
                />
              </View>

              <View style={styles.buttonsRow}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => setEditingBanner(item)}
                >
                  <Text>Изменить</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.deleteText}>Удалить</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 13,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  thumb: {
    width: '100%',
    height: 100,
  },
  thumbPlaceholder: {
    width: '100%',
    height: 60,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  thumbPlaceholderText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  cardActions: {
    padding: 12,
    gap: 10,
  },
  launchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  deleteBtn: {
    borderColor: '#fcc',
  },
  deleteText: {
    color: '#c00',
  },
});
