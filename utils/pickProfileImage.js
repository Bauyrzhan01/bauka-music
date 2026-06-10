import * as ImagePicker from 'expo-image-picker';

export async function pickProfileImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, error: 'Нет доступа к галерее' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return { ok: false, cancelled: true };
  }

  return { ok: true, uri: result.assets[0].uri };
}
