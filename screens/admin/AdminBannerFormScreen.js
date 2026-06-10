import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Button,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useBanners } from '../../context/BannersContext';
import { pickBannerImage } from '../../utils/pickBannerImage';

export default function AdminBannerFormScreen({ banner, onBack, embedded }) {
  const { addBanner, updateBanner } = useBanners();
  const isEdit = !!banner;

  const [imageUri, setImageUri] = useState(banner?.imageUri ?? null);
  const [active, setActive] = useState(banner?.active ?? false);
  const [error, setError] = useState('');

  const handlePickImage = async () => {
    const picked = await pickBannerImage();
    if (!picked.ok) {
      if (picked.error) setError(picked.error);
      return;
    }
    setError('');
    setImageUri(picked.uri);
  };

  const handleSave = async () => {
    if (!imageUri) {
      setError('Выберите фото для баннера');
      return;
    }

    const payload = { imageUri, active };

    if (isEdit) {
      const isNewImage = imageUri !== banner.imageUri;
      await updateBanner(banner.id, {
        active,
        ...(isNewImage ? { imageUri } : {}),
      });
    } else {
      await addBanner(payload);
    }

    onBack();
  };

  return (
    <View style={[styles.container, embedded && styles.embedded]}>
      <View style={styles.header}>
        {embedded ? (
          <Pressable onPress={onBack}>
            <Text style={styles.cancelLink}>← Назад к списку</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
        )}
        <Text style={styles.title}>
          {isEdit ? 'Редактировать баннер' : 'Новый NBO баннер'}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.form}>
        <Pressable style={styles.photoButton} onPress={handlePickImage}>
          <Text>Выбрать фото</Text>
        </Pressable>

        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
            contentFit="cover"
          />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="image-outline" size={40} color="#999" />
            <Text style={styles.placeholderText}>Фото баннера</Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.switchRow}>
          <Text>Запустить на главной</Text>
          <Switch value={active} onValueChange={setActive} />
        </View>

        <Button title="Сохранить" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  embedded: {
    backgroundColor: 'transparent',
  },
  cancelLink: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    width: 24,
  },
  form: {
    padding: 16,
    gap: 12,
  },
  photoButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  previewPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    color: '#999',
  },
  error: {
    color: '#c00',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
