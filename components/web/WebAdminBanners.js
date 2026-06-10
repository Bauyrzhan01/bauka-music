import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useBanners } from '../../context/BannersContext';
import { confirmAction } from '../../utils/confirmAction';
import AdminBannerFormScreen from '../../screens/admin/AdminBannerFormScreen';
import AdminPageHeader from './AdminPageHeader';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

export default function WebAdminBanners() {
  const { isMobile } = useWebBreakpoint();
  const { banners, launchBanner, stopBanner, deleteBanner } = useBanners();
  const [editingBanner, setEditingBanner] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating || editingBanner) {
    return (
      <AdminBannerFormScreen
        banner={editingBanner}
        embedded
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
      message: 'Баннер исчезнет на всех устройствах',
      confirmText: 'Удалить',
      destructive: true,
    });
    if (ok) await deleteBanner(banner.id);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <AdminPageHeader
        title="NBO баннеры"
        subtitle="Баннеры на главной странице приложения"
      >
        <Pressable
          style={[styles.addBtn, isMobile && styles.addBtnFull]}
          onPress={() => setIsCreating(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Добавить баннер</Text>
        </Pressable>
      </AdminPageHeader>

      {banners.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Нет баннеров. Добавьте первый NBO баннер</Text>
        </View>
      ) : (
        <View style={[styles.grid, isMobile && styles.gridMobile]}>
          {banners.map((item) => (
            <View
              key={item.id}
              style={[styles.card, isMobile && styles.cardMobile]}
            >
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.image}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>Нет фото</Text>
                </View>
              )}

              <View style={styles.cardBody}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {item.active ? 'На главной' : 'Скрыт'}
                  </Text>
                  <Switch
                    value={item.active}
                    onValueChange={(v) =>
                      v ? launchBanner(item.id) : stopBanner(item.id)
                    }
                  />
                </View>

                <View style={styles.actions}>
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
    paddingHorizontal: 16,
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
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  gridMobile: {
    flexDirection: 'column',
  },
  card: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardMobile: {
    width: '100%',
    maxWidth: '100%',
  },
  image: {
    width: '100%',
    height: 140,
  },
  noImage: {
    height: 140,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: '#999',
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontWeight: '600',
  },
  actions: {
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
